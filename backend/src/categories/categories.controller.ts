import { Controller, Get, Headers } from '@nestjs/common';
import { ComplaintCategory } from '@prisma/client';

const COMPANY_CATEGORIES = [
  'telecom',
  'banking',
  'retail',
  'utilities',
  'transport',
  'health',
  'education',
  'government',
  'other',
];

const LABELS: Record<string, Record<string, string>> = {
  en: {
    QUALITY: 'Quality',
    BILLING: 'Billing',
    DELIVERY: 'Delivery',
    SUPPORT: 'Customer support',
    ACCOUNT: 'Account',
    WARRANTY: 'Warranty',
    MISLEADING: 'Misleading',
    OTHER: 'Other',
    telecom: 'Telecom',
    banking: 'Banking',
    retail: 'Retail',
    utilities: 'Utilities',
    transport: 'Transport',
    health: 'Health',
    education: 'Education',
    government: 'Government',
    other: 'Other',
  },
  mk: {
    QUALITY: 'Квалитет',
    BILLING: 'Наплата',
    DELIVERY: 'Достава',
    SUPPORT: 'Поддршка',
    ACCOUNT: 'Сметка',
    WARRANTY: 'Гаранција',
    MISLEADING: 'Заблудувачко',
    OTHER: 'Друго',
    telecom: 'Телекомуникации',
    banking: 'Банкарство',
    retail: 'Трговија',
    utilities: 'Комуналии',
    transport: 'Транспорт',
    health: 'Здравство',
    education: 'Образование',
    government: 'Држава',
    other: 'Друго',
  },
  sq: {
    QUALITY: 'Cilësia',
    BILLING: 'Faturimi',
    DELIVERY: 'Dorëzimi',
    SUPPORT: 'Mbështetja',
    ACCOUNT: 'Llogaria',
    WARRANTY: 'Garancia',
    MISLEADING: 'Mashtruese',
    OTHER: 'Tjetër',
    telecom: 'Telekomunikacioni',
    banking: 'Bankat',
    retail: 'Tregtia',
    utilities: 'Shërbimet',
    transport: 'Transporti',
    health: 'Shëndetësia',
    education: 'Arsimi',
    government: 'Qeveria',
    other: 'Tjetër',
  },
};

@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  @Get()
  list(@Headers('accept-language') acceptLanguage?: string) {
    const locale = pickLocale(acceptLanguage);
    const labels = LABELS[locale];
    return {
      complaint: Object.values(ComplaintCategory).map((c) => ({ id: c, label: labels[c] })),
      company: COMPANY_CATEGORIES.map((c) => ({ id: c, label: labels[c] })),
    };
  }
}

function pickLocale(header?: string): 'mk' | 'sq' | 'en' {
  const supported: ('mk' | 'sq' | 'en')[] = ['mk', 'sq', 'en'];
  if (!header) return 'en';
  const first = header.split(',')[0]?.split(';')[0]?.trim().toLowerCase().slice(0, 2);
  return (supported.find((s) => s === first) ?? 'en');
}
