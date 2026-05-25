import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';
import { ComplaintCategory } from '@prisma/client';

export class CreateComplaintDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @Length(8, 160)
  title!: string;

  @IsString()
  @Length(30, 8000)
  body!: string;

  @IsEnum(ComplaintCategory)
  category!: ComplaintCategory;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^\+?[0-9 ()\-]+$/, { message: 'Invalid phone number' })
  contactPhone?: string;
}
