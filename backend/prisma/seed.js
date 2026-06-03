/* eslint-disable no-console */
/**
 * Idempotent seed script. Plain JS so it runs without ts-node inside the
 * production Docker image (which doesn't ship ts-node).
 *
 * Safe to run repeatedly: every record uses upsert or checks for existence
 * before inserting.
 */
const { PrismaClient, ComplaintCategory, ComplaintStatus, AuditActorRole } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] admin user…');
  const adminHash = await argon2.hash('DemoAdmin123!', { type: argon2.argon2id });
  await prisma.adminUser.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: { email: 'admin@demo.com', passwordHash: adminHash, displayName: 'Demo Admin' },
  });

  console.log('[seed] companies…');
  const demoCo = await prisma.company.upsert({
    where: { slug: 'demo-telecom' },
    update: {},
    create: {
      slug: 'demo-telecom',
      name: 'Demo Telecom',
      category: 'telecom',
      website: 'https://demo-telecom.example',
      contactEmail: 'support@demo-telecom.example',
      phone: '+389 2 000 0000',
      description: 'Sample telecommunications operator used for platform demos.',
    },
  });

  await prisma.company.upsert({
    where: { slug: 'demo-bank' },
    update: {},
    create: {
      slug: 'demo-bank',
      name: 'Demo Bank',
      category: 'banking',
      website: 'https://demo-bank.example',
      contactEmail: 'care@demo-bank.example',
      description: 'Sample retail bank used for platform demos.',
    },
  });

  console.log('[seed] company rep…');
  const repHash = await argon2.hash('DemoRep123!', { type: argon2.argon2id });
  await prisma.companyUser.upsert({
    where: { email: 'rep@demo.com' },
    update: {},
    create: {
      email: 'rep@demo.com',
      passwordHash: repHash,
      displayName: 'Demo Telecom Rep',
      companyId: demoCo.id,
    },
  });

  // Only seed demo complaints if none exist yet — keeps the script idempotent.
  const existing = await prisma.complaint.count({ where: { companyId: demoCo.id } });
  if (existing > 0) {
    console.log(`[seed] complaints already present (${existing}), skipping.`);
  } else {
    console.log('[seed] demo complaints…');
    const c1 = await prisma.complaint.create({
      data: {
        companyId: demoCo.id,
        title: 'Internet outage for three days, no response',
        body:
          'My fiber line has been down since Monday morning. ' +
          'I have opened three tickets and called twice with no callback.',
        complaintCategory: ComplaintCategory.SUPPORT,
        status: ComplaintStatus.NEW,
        isPublished: true,
        ipHash: 'seed',
      },
    });
    await prisma.complaintUpdate.create({
      data: { complaintId: c1.id, actor: AuditActorRole.SYSTEM, note: 'complaint.created' },
    });

    const c2 = await prisma.complaint.create({
      data: {
        companyId: demoCo.id,
        title: 'Overcharged on monthly bill, no explanation provided',
        body:
          'I was charged 1,250 MKD more than the contracted amount this month. ' +
          'Support could not explain the difference and asked me to wait.',
        complaintCategory: ComplaintCategory.BILLING,
        status: ComplaintStatus.CONTACTED,
        isPublished: true,
        companyReply:
          'Thank you for reaching out. Our billing team is investigating ' +
          'and will contact you within 48 hours.',
        companyReplyUpdatedAt: new Date(),
        ipHash: 'seed',
      },
    });
    await prisma.complaintUpdate.createMany({
      data: [
        { complaintId: c2.id, actor: AuditActorRole.SYSTEM,  note: 'complaint.created' },
        { complaintId: c2.id, actor: AuditActorRole.COMPANY, note: 'complaint.reply.added' },
        { complaintId: c2.id, actor: AuditActorRole.COMPANY, note: 'complaint.status.contacted' },
      ],
    });
  }

  console.log('[seed] done.');
}

main()
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
