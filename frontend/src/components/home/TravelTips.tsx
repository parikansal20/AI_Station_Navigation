import { Luggage, Navigation } from "lucide-react";

const travelTips = [
  {
    title: "Use AI Navigation",
    description: "Find the shortest and least crowded route to your destination.",
    Icon: Navigation,
  },
  {
    title: "Keep Your Luggage Secure",
    description: "Keep your luggage close and never leave it unattended.",
    Icon: Luggage,
  },
];

export function TravelTips() {
  return (
    <section
      aria-labelledby="travel-tips-title"
      className="group flex min-h-64 flex-1 overflow-hidden rounded-3xl border border-[#134489]/15 bg-white shadow-[0_8px_24px_rgba(19,68,137,.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(19,68,137,.14)]"
    >
      <div className="flex w-full flex-col justify-center px-5 py-5 sm:px-6">
        <header className="mb-4 flex items-start justify-between gap-3">
          <h3 id="travel-tips-title" className="text-lg font-black tracking-tight text-[#010105]">
            <span aria-hidden="true">🧭</span> Travel Tips
          </h3>
          <span className="shrink-0 rounded-full bg-[#134489]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#134489]">
            AI Recommendation
          </span>
        </header>

        <div>
          {travelTips.map(({ title, description, Icon }, index) => (
            <article
              key={title}
              className={`flex items-start gap-4 py-3 ${
                index > 0 ? "border-t border-[#134489]/12" : "pt-0"
              }`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#134489] text-[#FAC24A] shadow-sm">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="min-w-0 pt-0.5">
                <h4 className="text-base font-black leading-tight text-[#010105]">{title}</h4>
                <p className="mt-1 text-sm font-medium leading-relaxed text-[#5B6470]">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
