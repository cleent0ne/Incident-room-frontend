const PALETTE = ['#ff9f1c', '#2bd576', '#5b8cff', '#ffd166', '#ff5c5c', '#a78bfa'];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? '';
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length]!;
}

export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `${colorFor(name)}22`,
        color: colorFor(name),
        border: `1px solid ${colorFor(name)}55`,
      }}
      aria-hidden="true"
    >
      {initialsFor(name)}
    </div>
  );
}
