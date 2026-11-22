export function StatCard({ label, value, detail, icon: Icon, tone = "light", onClick, onDetailClick }) {
  const styles = {
    light: "border-black/7 bg-white/55 text-[#010105]",
    blue: "border-[#134489] bg-[#134489] text-white",
    gold: "border-[#FAC24A] bg-[#FAC24A] text-[#010105]",
    lemon: "border-[#EDEBB9] bg-[#EDEBB9] text-[#010105]",
    ocean: "border-[#1D3557] bg-[#1D3557] text-white",
    frost: "border-[#A8DADC] bg-[#A8DADC] text-[#1D3557]",
    honeydew: "border-[#A8DADC]/70 bg-white/70 text-[#1D3557]",
    strawberry: "border-[#E63946] bg-[#E63946] text-white",
  };

  return (
    <article className={`admin-rise rounded-[22px] border p-5 shadow-[0_10px_30px_rgba(1,1,5,.05)] ${styles[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-55">{label}</p>
        {Icon && <span className="grid h-9 w-9 place-items-center rounded-xl bg-current/10"><Icon className="h-4 w-4" /></span>}
      </div>
      {onClick ? (
        <button type="button" onClick={onClick} className="group mt-5 block text-left">
          <span className="block text-3xl font-black tracking-[-0.04em]">{value}</span>
          <span className="mt-1 block text-[10px] font-black uppercase tracking-wider opacity-60 group-hover:underline">View names →</span>
        </button>
      ) : <p className="mt-5 text-3xl font-black tracking-[-0.04em]">{value}</p>}
      {onDetailClick ? (
        <button
          type="button"
          onClick={() => {
            onDetailClick();
          }}
          className="mt-1.5 text-left text-xs opacity-55 underline-offset-2 hover:underline"
        >
          {detail}
        </button>
      ) : <p className="mt-1.5 text-xs opacity-55">{detail}</p>}
    </article>
  );
}
