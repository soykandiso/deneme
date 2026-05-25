import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: { complaintId: string; dto: CreateReportDto; ipHash: string }): Promise<{ id: string }> {
    const exists = await this.prisma.complaint.findFirst({
      where: { id: params.complaintId, isPublished: true, isDeleted: false, NOT: { status: 'REMOVED' } },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Complaint not found.' });

    try {
      const row = await this.prisma.report.create({
        data: {
          complaintId: params.complaintId,
          reason: params.dto.reason,
          detail: params.dto.detail,
          ipHash: params.ipHash,
        },
      });
      return { id: row.id };
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw new ConflictException({ code: 'CONFLICT', message: 'You already reported this complaint.' });
      }
      throw err;
    }
  }
}
