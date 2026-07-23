export default function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-base-50 px-6"
    >
      <div className="surface-card-solid flex items-center gap-4 px-6 py-5 text-ink-700">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
        />
        <span className="text-sm font-bold">Đang chuẩn bị trải nghiệm Smacco…</span>
      </div>
    </div>
  );
}
