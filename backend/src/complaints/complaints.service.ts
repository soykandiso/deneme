import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { AuditActorRole, Complaint, ComplaintStatus, Prisma } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ListComplaintsDto } from './dto/list-complaints.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { decodeCursor, encodeCursor, Page } from '../common/util/pagination';

export interface ComplaintSummary {
  id: string;
  title: string;
  category: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  hasReply: boolean;
  attachmentCount: number;
  company: { id: string; slug: string; name: string };
}

export interface ComplaintDetail extends ComplaintSummary {
  body: string;
  companyReply: string | null;
  companyReplyUpdatedAt: string | null;
  attachments: Array<{ id: string; contentType: string; filename: string; size: number }>;
  timeline: Array<{ id: string; actor: string; note: string; createdAt: string }>;
}

const PUBLIC_WHERE: Prisma.ComplaintWhereInput = {
  isPublished: true,
  isDeleted: false,
  NOT: { status: 'REMOVED' },
};

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(dto: ListComplaintsDto): Promise<Page<ComplaintSummary>> {
    const limit = dto.limit ?? 20;
    const cursor = decodeCursor<{ id: string; createdAt: string }>(dto.cursor);

    const where: Prisma.ComplaintWhereInput = { ...PUBLIC_WHERE };
    if (dto.companyId) where.companyId = dto.companyId;
    if (dto.category) where.complaintCategory = dto.category;
    if (dto.status) where.status = dto.status;
    if (dto.q) {
      where.OR = [
        { title: { contains: dto.q, mode: 'insensitive' } },
        { body: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ComplaintOrderByWithRelationInput[] =
      dto.sort === 'oldest'
        ? [{ createdAt: 'asc' }, { id: 'asc' }]
        : dto.sort === 'updated'
          ? [{ updatedAt: 'desc' }, { id: 'asc' }]
          : dto.sort === 'reported'
            ? [{ reports: { _count: 'desc' } }, { id: 'asc' }]
            : [{ createdAt: 'desc' }, { id: 'asc' }];

    const rows = await this.prisma.complaint.findMany({
      where,
      orderBy,
      take: limit + 1,
      cursor: cursor ? { id: cursor.id } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        company: { select: { id: true, slug: true, name: true } },
        _count: { select: { attachments: true } },
      },
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const last = slice[slice.length - 1];

    return {
      items: slice.map(this.toSummary),
      nextCursor:
        hasMore && last
          ? encodeCursor({ id: last.id, createdAt: last.createdAt.toISOString() })
          : null,
    };
  }

  async publicDetail(id: string): Promise<ComplaintDetail> {
    const c = await this.prisma.complaint.findFirst({
      where: { id, ...PUBLIC_WHERE },
      include: {
        company: { select: { id: true, slug: true, name: true } },
        attachments: { select: { id: true, contentType: true, originalFilename: true, fileSize: true } },
        updates: { orderBy: { createdAt: 'asc' } },
        _count: { select: { attachments: true } },
      },
    });
    if (!c) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Complaint not found.' });

    await this.prisma.complaint.update({
      where: { id: c.id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      ...this.toSummary(c),
      body: c.body,
      companyReply: c.companyReply,
      companyReplyUpdatedAt: c.companyReplyUpdatedAt?.toISOString() ?? null,
      attachments: c.attachments.map((a) => ({
        id: a.id,
        contentType: a.contentType,
        filename: a.originalFilename,
        size: Number(a.fileSize),
      })),
      timeline: c.updates.map((u) => ({
        id: u.id,
        actor: u.actor.toLowerCase(),
        note: u.note,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }

  async createDraft(dto: CreateComplaintDto, ipHash: string): Promise<{
    id: string;
    draftToken: string;
    expiresAt: string;
  }> {
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Unknown company.', details: { field: 'companyId' } });
    }

    const tokenRaw = randomBytes(24).toString('base64url');
    const tokenHash = createHash('sha256').update(tokenRaw).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const c = await this.prisma.complaint.create({
      data: {
        companyId: dto.companyId,
        title: dto.title,
        body: dto.body,
        complaintCategory: dto.category,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        ipHash,
        draftTokenHash: tokenHash,
        draftExpiresAt: expiresAt,
      },
    });

    return { id: c.id, draftToken: tokenRaw, expiresAt: expiresAt.toISOString() };
  }

  async publish(id: string, draftToken: string): Promise<{ id: string }> {
    const c = await this.findDraft(id, draftToken);
    if (c.isPublished) {
      throw new ConflictException({ code: 'CONFLICT', message: 'Already published.' });
    }
    await this.prisma.$transaction([
      this.prisma.complaint.update({
        where: { id: c.id },
        data: {
          isPublished: true,
          draftTokenHash: null,
          draftExpiresAt: null,
        },
      }),
      this.prisma.complaintUpdate.create({
        data: { complaintId: c.id, actor: AuditActorRole.SYSTEM, note: 'complaint.created' },
      }),
    ]);
    await this.audit.log({
      actorRole: AuditActorRole.PUBLIC,
      action: 'complaint.create',
      targetType: 'complaint',
      targetId: c.id,
    });
    return { id: c.id };
  }

  async findDraft(id: string, draftToken: string): Promise<Complaint> {
    const hash = createHash('sha256').update(draftToken).digest('hex');
    const c = await this.prisma.complaint.findFirst({
      where: { id, draftTokenHash: hash },
    });
    if (!c) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Draft not found or token invalid.' });
    }
    if (c.draftExpiresAt && c.draftExpiresAt < new Date()) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Draft expired.' });
    }
    return c;
  }

  private toSummary = (
    c: Prisma.ComplaintGetPayload<{
      include: {
        company: { select: { id: true; slug: true; name: true } };
        _count: { select: { attachments: true } };
      };
    }>,
  ): ComplaintSummary => ({
    id: c.id,
    title: c.title,
    category: c.complaintCategory,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    hasReply: !!c.companyReply,
    attachmentCount: c._count.attachments,
    company: c.company,
  });
}
