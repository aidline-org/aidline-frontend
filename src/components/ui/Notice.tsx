export function Notice({
  title,
  children,
  tone = 'neutral',
}: {
  title: string;
  children?: React.ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={`border-l-2 py-1 pl-4 ${tone === 'danger' ? 'border-danger' : 'border-ink'}`}
    >
      <p className={`font-medium ${tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{title}</p>
      {children && <div className="mt-1 text-[0.9375rem]">{children}</div>}
    </div>
  );
}
