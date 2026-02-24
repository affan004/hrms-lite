interface SummaryCardProps {
  label: string;
  value: number;
}

export function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <article className="summary-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}

