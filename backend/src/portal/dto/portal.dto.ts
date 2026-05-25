import { IsEnum, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { ComplaintStatus } from '@prisma/client';
import { PaginationDto } from '../../common/util/pagination';

export class ListPortalComplaintsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsString()
  q?: string;
}

export class AddReplyDto {
  @IsString()
  @Length(5, 4000)
  reply!: string;
}

export class UpdatePortalStatusDto {
  @IsIn(['CONTACTED', 'RESOLVED'])
  status!: 'CONTACTED' | 'RESOLVED';
}
