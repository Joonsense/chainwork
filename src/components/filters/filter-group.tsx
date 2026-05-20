/** Layout wrapper for one filter section in the sidebar (server). */
export function FilterGroup({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-subtle py-3.5">
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="text-[12px] font-semibold text-text-primary">
          {title}
        </span>
        {note && <span className="text-[10.5px] text-text-muted">· {note}</span>}
      </div>
      {children}
    </div>
  );
}
