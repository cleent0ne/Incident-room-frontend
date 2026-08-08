/**
 * Wraps the existing `.empty` class (unchanged — see app/globals.css) so an empty
 * result and an optional next step (a link, a retry button) render consistently,
 * instead of every page hand-rolling its own `<div className="empty">` markup.
 * Purely additive: pages that already have their own `.empty` divs from earlier
 * milestones don't need to be migrated for this to be useful going forward.
 */
export function EmptyState({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <p>{children}</p>
      {action}
    </div>
  );
}
