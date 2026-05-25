import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListCompaniesDto } from './dto/list-companies.dto';
import { decodeCursor, encodeCursor, Page } from '../common/util/pagination';

export interface CompanySummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  logoUrl: string | null;
  description: string | null;
  complaintCount: number;
}

export interface CompanyDetail extends CompanySummary {
  website: string | null;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(dto: ListCompaniesDto): Promise<Page<CompanySummary>> {
    const limit = dto.limit ?? 20;
    const cursor = decodeCursor<{ id: string; name: string }>(dto.cursor);
    const [sortField, sortDir] = (dto.sort ?? 'name:asc').split(':') as ['name' | 'created', 'asc' | 'desc'];

    const where: Prisma.CompanyWhereInput = {};
    if (dto.category) where.category = dto.category;
    if (dto.q) {
      // tsvector FTS via raw expression — fall back to ILIKE to keep prisma happy for now.
      where.name = { contains: dto.q, mode: 'insensitive' };
    }

    const orderBy: Prisma.CompanyOrderByWithRelationInput =
      sortField === 'created'
        ? { createdAt: sortDir }
        : { name: sortDir };

    const rows = await this.prisma.company.findMany({
      where,
      orderBy: [orderBy, { id: 'asc' }],
      take: limit + 1,
      cursor: cursor ? { id: cursor.id } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        _count: { select: { complaints: { where: { isPublished: true, isDeleted: false, NOT: { status: 'REMOVED' } } } } },
      },
    });

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const last = slice[slice.length - 1];

    return {
      items: slice.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        category: c.category,
        logoUrl: c.logoUrl,
        description: c.description,
        complaintCount: c._count.complaints,
      })),
      nextCursor: hasMore && last ? encodeCursor({ id: last.id, name: last.name }) : null,
    };
  }

  async detailBySlug(slug: string): Promise<CompanyDetail> {
    const c = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        _count: { select: { complaints: { where: { isPublished: true, isDeleted: false, NOT: { status: 'REMOVED' } } } } },
      },
    });
    if (!c) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Company not found.' });
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      category: c.category,
      logoUrl: c.logoUrl,
      description: c.description,
      website: c.website,
      contactEmail: c.contactEmail,
      phone: c.phone,
      address: c.address,
      createdAt: c.createdAt.toISOString(),
      complaintCount: c._count.complaints,
    };
  }
}
