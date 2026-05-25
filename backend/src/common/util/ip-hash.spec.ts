import { hashIp } from './ip-hash';

describe('hashIp', () => {
  it('produces a stable 64-char hex digest', () => {
    const a = hashIp('1.2.3.4', 'pepper');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIp('1.2.3.4', 'pepper')).toBe(a);
  });

  it('changes when the pepper changes', () => {
    expect(hashIp('1.2.3.4', 'p1')).not.toBe(hashIp('1.2.3.4', 'p2'));
  });
});
