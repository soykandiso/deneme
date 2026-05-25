import { IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
