export function LoadingSpinner() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center animate-rise sm:py-24"
      role="status"
      aria-live="polite"
    >
      <div className="relative size-11">
        <div className="absolute inset-0 rounded-full border-2 border-slate-300" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-ink animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground max-w-[16rem] leading-relaxed">
        ვაანალიზებთ მოთხოვნას და ვეძებთ…
      </p>
    </div>
  );
}
