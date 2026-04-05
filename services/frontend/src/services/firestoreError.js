export function normalizeFirestoreError(error, fallback = 'Đã có lỗi dữ liệu. Vui lòng thử lại.') {
  const code = error?.code || '';

  if (code.includes('permission-denied')) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }
  if (code.includes('unauthenticated')) {
    return 'Vui lòng đăng nhập để tiếp tục.';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Không thể kết nối đến dịch vụ. Vui lòng thử lại.';
  }
  if (code.includes('deadline-exceeded')) {
    return 'Hệ thống đang bận. Vui lòng thử lại sau.';
  }

  return error?.message || fallback;
}
