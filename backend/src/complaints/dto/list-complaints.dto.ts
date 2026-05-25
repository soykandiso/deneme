import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ComplaintCategory, ComplaintStatus } from '@prisma/client';
import { PaginationDto } from '../../common/util/pagination';

export class ListComplaintsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'updated', 'reported'])
  sort?: 'newest' | 'oldest' | 'updated' | 'reported' = 'newest';
}
