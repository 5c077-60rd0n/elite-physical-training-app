interface TrendPoint {
  label: string;
  value: number;
}

interface SimpleTrendChartProps {
  title: string;
  points: TrendPoint[];
  colorClass: 'cyan' | 'gold';
  unit?: string;
}

export function SimpleTrendChart({ title, points, colorClass, unit = '' }: SimpleTrendChartProps) {
  if (!points.length) {
    return (
      <article className="chart-card">
        <span className="card-kicker">Chart</span>
        <h3 className="exercise-name">{title}</h3>
        <p className="exercise-note">Not enough data yet.</p>
      </article>
    );
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const height = 120;

  const path = points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - ((point.value - min) / range) * (height - 12) - 6;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <article className="chart-card">
      <span className="card-kicker">Chart</span>
      <h3 className="exercise-name">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className={`trend-chart ${colorClass}`} role="img" aria-label={title}>
        <path d={path} fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="chart-labels">
        {points.map((point) => (
          <div key={`${title}-${point.label}`}>
            <span className="list-caption">{point.label}</span>
            <strong>{point.value}{unit}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}