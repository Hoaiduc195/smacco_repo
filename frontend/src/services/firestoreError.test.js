import { describe, expect, it } from 'vitest';
import { normalizeFirestoreError } from './firestoreError';

describe('normalizeFirestoreError', () => {
  it('maps permission denied errors', () => {
    const message = normalizeFirestoreError({ code: 'permission-denied' });
    expect(message).toBe('Bạn không có quyền thực hiện thao tác này.');
  });

  it('maps unauthenticated errors', () => {
    const message = normalizeFirestoreError({ code: 'unauthenticated' });
    expect(message).toBe('Vui lòng đăng nhập để tiếp tục.');
  });

  it('maps network unavailable errors', () => {
    const message = normalizeFirestoreError({ code: 'unavailable/network-request-failed' });
    expect(message).toBe('Không thể kết nối đến dịch vụ. Vui lòng thử lại.');
  });

  it('uses fallback for unknown errors', () => {
    const message = normalizeFirestoreError({ code: 'other' }, 'fallback message');
    expect(message).toBe('fallback message');
  });
});
