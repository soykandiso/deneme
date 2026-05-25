import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/util/pagination';

export class ListCompaniesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['name:asc', 'name:desc', 'created:asc', 'created:desc'])
  sort?: 'name:asc' | 'name:desc' | 'created:asc' | 'created:desc' = 'name:asc';
}
