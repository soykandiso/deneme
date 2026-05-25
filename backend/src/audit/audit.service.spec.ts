import { AuditService } from './audit.service';
import { AuditActorRole } from '@prisma/client';

describe('AuditService sanitizer', () => {
  let svc: AuditService;
  let created: unknown;

  beforeEach(() => {
    created = null;
    const prismaMock = {
      adminAuditLog: {
        create: jest.fn(async ({ data }) => {
          created = data;
          return data;
        }),
      },
    } as unknown as ConstructorParameters<typeof AuditService>[0];
    svc = new AuditService(prismaMock);
  });

  it('redacts sensitive keys in payload', async () => {
    await svc.log({
      actorRole: AuditActorRole.ADMIN,
      action: 'admin.companyUser.create',
      targetType: 'companyUser',
      targetId: 'abc',
      payload: { contactEmail: 'a@b.c', token: 'XYZ', okay: 'visible' },
    });
    expect((created as { payloadJson: Record<string, string> }).payloadJson).toEqual({
      contactEmail: '[redacted]',
      token: '[redacted]',
      okay: 'visible',
    });
  });
});
