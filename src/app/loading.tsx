export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
        <p className="text-sm text-text-tertiary">Loading...</p>
      </div>
    </div>
  );
}
