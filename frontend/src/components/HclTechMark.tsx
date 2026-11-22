export function HclTechMark({ className = "" }: { className?: string }) {
  return (
    <div
      aria-label="HCLTech — Supercharging Progress"
      className={`pointer-events-auto flex shrink-0 items-center rounded-xl border border-slate-200 bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur transition-transform hover:scale-105 ${className}`}
    >
      <span className="bg-gradient-to-r from-[#7437dc] to-[#168ce7] bg-clip-text text-[13px] font-black tracking-[-.04em] text-transparent">
        HCLTech
      </span>
      <span className="mx-2 h-4 w-px bg-slate-300" />
      <span className="max-w-[62px] text-[7px] font-semibold leading-[1.05] text-slate-500">
        Supercharging
        <br />
        Progress™
      </span>
    </div>
  );
}
