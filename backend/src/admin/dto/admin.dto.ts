import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUrl, Length, MaxLength, MinLength } from 'class-validator';
import { ComplaintStatus, SuggestionStatus } from '@prisma/client';
import { PaginationDto } from '../../common/util/pagination';

export class AdminListComplaintsDto extends PaginationDto {
  @IsOptional() @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @IsBoolean()
  includeDeleted?: boolean;
}

export class AdminSetStatusDto {
  @IsEnum(ComplaintStatus)
  status!: ComplaintStatus;
}

export class AdminApproveSuggestionDto {
  @IsString() @Length(2, 60)
  slug!: string;

  @IsString() @Length(2, 60)
  category!: string;
}

export class AdminRejectSuggestionDto {
  @IsOptional() @IsString() @MaxLength(400)
  note?: string;
}

export class AdminListSuggestionsDto {
  @IsOptional() @IsEnum(SuggestionStatus)
  status?: SuggestionStatus;
}

export class CreateCompanyDto {
  @IsString() @Length(2, 60)
  slug!: string;

  @IsString() @Length(2, 120)
  name!: string;

  @IsString() @Length(2, 60)
  category!: string;

  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(300)
  website?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;
}

export class CreateCompanyUserDto {
  @IsEmail() @MaxLength(254)
  email!: string;

  @IsString() @MinLength(12) @MaxLength(200)
  password!: string;

  @IsString() @MinLength(2) @MaxLength(120)
  displayName!: string;
}
