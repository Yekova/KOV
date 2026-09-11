// Decorative dashboard-style card, not a real analytics claim — bar
// heights are illustrative (a capability demo, the same way the site's own
// screenshot showcases display sample interfaces), so there's no fabricated
// headline stat like "+325%" attached to it. Month labels are the one real,
// non-invented thing on the chart.
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août"];
const BAR_HEIGHTS = [22, 34, 28, 46, 40, 58, 52, 70];

export function HeroChartWidget() {
  return (
    <div
      className="relative h-full w-full flex flex-col justify-between p-4"
      style={{
        borderRadius: 18,
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-kov-steel text-[10px] uppercase tracking-widest">Performance</p>
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
      </div>

      <div className="flex items-end gap-1.5 flex-1 mt-3">
        {BAR_HEIGHTS.map((height, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end h-full">
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${height}%`,
                background: i === BAR_HEIGHTS.length - 1 ? "var(--kov-red)" : "rgba(227, 30, 36, 0.35)",
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2">
        {MONTHS.map((month) => (
          <span key={month} className="text-kov-steel text-[8px] uppercase tracking-wide">
            {month}
          </span>
        ))}
      </div>
    </div>
  );
}
