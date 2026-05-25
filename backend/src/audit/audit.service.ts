import { Injectable } from '@nestjs/common';
import { AuditActorRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  actorRole: AuditActorRole;
  actorId?: string;
  action: string;
  targetType: string;
  targetId: string;
  payload?: Prisma.InputJsonValue;
  ipHash?: string;
}

const SENSITIVE_KEYS = ['password', 'token', 'refreshToken', 'contactEmail', 'contactPhone'];

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        actorRole: entry.actorRole,
        actorId: entry.actorId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        payloadJson: entry.payload === undefined
          ? Prisma.JsonNull
          : this.sanitize(entry.payload),
        ipHash: entry.ipHash,
      },
    });
  }

  private sanitize(payload: Prisma.InputJsonValue): Prisma.InputJsonValue {
    if (typeof payload !== 'object' || payload === null) return payload;
    if (Array.isArray(payload)) {
      return payload.map((item) => this.sanitize(item as Prisma.InputJsonValue));
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.includes(k)) {
        out[k] = '[redacted]';
      } else if (v && typeof v === 'object') {
        out[k] = this.sanitize(v as Prisma.InputJsonValue);
      } else {
        out[k] = v;
      }
    }
    return out as Prisma.InputJsonValue;
  }
}
