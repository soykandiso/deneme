import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { clientIp, hashIp } from '../common/util/ip-hash';
import { RouteRateLimit, RouteRateLimitGuard } from '../common/util/rate-limit.guard';
import { AppConfig } from '../config/app.config';

@Controller({ path: 'suggestions', version: '1' })
export class SuggestionsController {
  constructor(
    private readonly suggestions: SuggestionsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Post()
  @UseGuards(RouteRateLimitGuard)
  @RouteRateLimit({ bucket: 'suggest', windowSeconds: 3600, max: 5 })
  create(@Body() dto: CreateSuggestionDto, @Req() req: Request) {
    const ipHash = hashIp(clientIp(req), this.config.get('IP_HASH_PEPPER', { infer: true }));
    return this.suggestions.create(dto, ipHash);
  }
}
