// ============================================================
// PageHeader — titre de page admin (style site vitrine)
// ============================================================
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-card-border pb-4">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-violet-light">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-text-muted">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
