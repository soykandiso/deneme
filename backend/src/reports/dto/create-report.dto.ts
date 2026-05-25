import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REPORT_REASONS = [
  'spam',
  'abuse',
  'hate',
  'duplicate',
  'private_info',
  'misleading',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export class CreateReportDto {
  @IsIn(REPORT_REASONS as unknown as string[])
  reason!: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  detail?: string;
}
