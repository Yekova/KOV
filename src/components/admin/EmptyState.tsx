export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kov/brand/kov-monogram-k-transparent.png"
        alt=""
        aria-hidden="true"
        className="w-10 h-auto mb-3 select-none"
        style={{ opacity: 0.18 }}
      />
      <p className="text-kov-steel text-sm">{message}</p>
    </div>
  );
}
