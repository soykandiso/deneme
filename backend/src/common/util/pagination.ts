import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

const CURSOR_VERSION = 'v1';

export function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify({ _v: CURSOR_VERSION, ...payload }), 'utf8').toString('base64url');
}

export function decodeCursor<T extends Record<string, unknown>>(cursor: string | undefined): T | null {
  if (!cursor) return null;
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    if (parsed._v !== CURSOR_VERSION) return null;
    delete parsed._v;
    return parsed as T;
  } catch {
    return null;
  }
}
