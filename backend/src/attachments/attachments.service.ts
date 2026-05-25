import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { S3StorageService } from '../storage/s3-storage.service';
import { UploaderRole } from '@prisma/client';
import { ComplaintsService } from '../complaints/complaints.service';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_PER_COMPLAINT = 5;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly complaints: ComplaintsService,
  ) {}

  async uploadToDraft(params: {
    complaintId: string;
    draftToken: string;
    file: Express.Multer.File;
  }): Promise<{ id: string; filename: string; size: number; contentType: string }> {
    if (!params.file) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'File required.' });
    }
    if (params.file.size > MAX_BYTES) {
      throw new PayloadTooLargeException({ code: 'PAYLOAD_TOO_LARGE', message: 'File exceeds 10 MB.' });
    }
    if (!ALLOWED_TYPES.has(params.file.mimetype)) {
      throw new UnsupportedMediaTypeException({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Allowed types: jpeg, png, webp, heic, pdf.',
      });
    }

    const complaint = await this.complaints.findDraft(params.complaintId, params.draftToken);

    const existing = await this.prisma.complaintAttachment.count({
      where: { complaintId: complaint.id },
    });
    if (existing >= MAX_PER_COMPLAINT) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: `Maximum ${MAX_PER_COMPLAINT} attachments per complaint.`,
      });
    }

    const sha = createHash('sha256').update(params.file.buffer).digest('hex');
    const storageKey = `complaints/${complaint.id}/${randomBytes(12).toString('hex')}`;

    // Upload to object storage first; if DB insert fails, schedule delete.
    await this.storage.put(storageKey, params.file.buffer, params.file.mimetype);
    try {
      const row = await this.prisma.complaintAttachment.create({
        data: {
          complaintId: complaint.id,
          storageKey,
          originalFilename: safeFilename(params.file.originalname),
          contentType: params.file.mimetype,
          fileSize: BigInt(params.file.size),
          sha256: sha,
          uploadedByRole: UploaderRole.PUBLIC,
        },
      });
      return {
        id: row.id,
        filename: row.originalFilename,
        size: Number(row.fileSize),
        contentType: row.contentType,
      };
    } catch (err: unknown) {
      await this.storage.delete(storageKey).catch(() => undefined);
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw new ConflictException({ code: 'CONFLICT', message: 'Duplicate attachment for this complaint.' });
      }
      throw err;
    }
  }

  async getPresignedPublicUrl(id: string): Promise<string> {
    const row = await this.prisma.complaintAttachment.findUnique({
      where: { id },
      include: { complaint: { select: { isPublished: true, isDeleted: true, status: true, companyId: true } } },
    });
    if (!row) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Attachment not found.' });
    const c = row.complaint;
    const isPublic = c.isPublished && !c.isDeleted && c.status !== 'REMOVED';
    if (!isPublic) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Attachment not found.' });
    return this.storage.presignDownload(row.storageKey, 300);
  }

  async getForCompany(id: string, companyId: string): Promise<string> {
    const row = await this.prisma.complaintAttachment.findUnique({
      where: { id },
      include: { complaint: { select: { companyId: true, isDeleted: true } } },
    });
    if (!row || row.complaint.companyId !== companyId || row.complaint.isDeleted) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Attachment not found.' });
    }
    return this.storage.presignDownload(row.storageKey, 300);
  }
}

function safeFilename(name: string): string {
  return name
    .replace(/[\x00-\x1f]/g, '')
    .replace(/[\\/]/g, '_')
    .slice(0, 200);
}
