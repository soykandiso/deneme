import { decodeCursor, encodeCursor } from './pagination';

describe('cursor codec', () => {
  it('round-trips arbitrary payloads', () => {
    const c = encodeCursor({ id: '00000000-0000-0000-0000-000000000001', extra: 7 });
    expect(decodeCursor(c)).toEqual({
      id: '00000000-0000-0000-0000-000000000001',
      extra: 7,
    });
  });

  it('returns null for malformed input', () => {
    expect(decodeCursor('not-base64-at-all!!!')).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
  });

  it('rejects unknown cursor versions', () => {
    const fake = Buffer.from(JSON.stringify({ _v: 'v999', id: 'x' })).toString('base64url');
    expect(decodeCursor(fake)).toBeNull();
  });
});
