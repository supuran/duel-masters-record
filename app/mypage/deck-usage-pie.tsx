const COLORS = ["#b38b3b", "#172137", "#6f8f88", "#c8775b", "#8e7eaa", "#d0b86d", "#58779a", "#9a6b72"];

export default function DeckUsagePie({
  format,
  entries,
}: {
  format: "ND" | "AD";
  entries: { name: string; count: number }[];
}) {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  const slices = entries.map((entry, index) => {
    const start = entries.slice(0, index).reduce((angle, previous) => angle + (previous.count / total) * 360, 0);
    const end = start + (entry.count / total) * 360;
    return { ...entry, color: COLORS[index % COLORS.length], start, end };
  });
  const background = total
    ? `conic-gradient(${slices.map((slice) => `${slice.color} ${slice.start}deg ${slice.end}deg`).join(", ")})`
    : "#eeece6";

  return (
    <section className="deck-format-chart" aria-label={`${format}の直近1か月のデッキ使用割合`}>
      <div className="deck-format-chart-heading">
        <h3>{format}</h3>
        <span>{total}試合</span>
      </div>
      <div className="deck-format-chart-content">
        <div className={`deck-pie${total ? "" : " is-empty"}`} style={{ background }} role="img" aria-label={total ? `${format}のデッキ使用割合。合計${total}試合` : `${format}の対戦記録はありません`}>
          <div><strong>{total}</strong><small>試合</small></div>
        </div>
        {slices.length ? (
          <ul className="deck-pie-legend">
            {slices.map((slice) => (
              <li key={slice.name}>
                <span className="deck-pie-swatch" style={{ backgroundColor: slice.color }} aria-hidden="true" />
                <span className="deck-pie-name" title={slice.name}>{slice.name}</span>
                <small>{Math.round((slice.count / total) * 100)}%</small>
              </li>
            ))}
          </ul>
        ) : <p className="deck-pie-empty-label">この期間の記録はありません</p>}
      </div>
    </section>
  );
}
