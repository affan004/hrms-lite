interface PanelHeaderProps {
  title: string;
  subtitle: string;
}

export function PanelHeader({ title, subtitle }: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}

