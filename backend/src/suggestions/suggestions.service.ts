import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';

@Injectable()
export class SuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSuggestionDto, ipHash: string): Promise<{ id: string }> {
    const row = await this.prisma.companySuggestion.create({
      data: {
        name: dto.name,
        website: dto.website,
        category: dto.category,
        note: dto.note,
        ipHash,
      },
    });
    return { id: row.id };
  }
}
