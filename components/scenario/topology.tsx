'use client';

import type { TopologyDto } from '@/lib/types';

// CORRECTION (post-OpenAPI-reconciliation): the real `TopologyDto.nodes` only carry
// `id`/`type`/`label` — the backend does NOT send layout coordinates. The M1 version
// of this component assumed `xPct`/`yPct` per node, which doesn't exist in the actual
// API. This version computes a deterministic layered layout client-side instead:
// nodes with no incoming edge are treated as sources (layer 0), everything else is
// placed at 1 + the layer of its furthest-reached predecessor (BFS), and nodes within
// a layer are spread evenly down that column. Disconnected/cyclic leftovers just land
// in layer 0 rather than breaking — good enough for the small (4-8 node) topologies
// these scenarios use; it doesn't need to be a general graph-layout engine.
const VIEWBOX_W = 400;
const VIEWBOX_H = 220;
const INSET = 30; // matches .topology svg { inset: 30px } in globals.css

interface Point {
  x: number;
  y: number;
}

function computeLayout(topology: TopologyDto): Map<string, Point> {
  const ids = topology.nodes.map((n) => n.id);
  const adjacency = new Map<string, string[]>(ids.map((id) => [id, []]));
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));

  for (const edge of topology.edges) {
    if (!adjacency.has(edge.from) || !indegree.has(edge.to)) continue;
    adjacency.get(edge.from)!.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }

  const layer = new Map<string, number>();
  const queue: string[] = ids.filter((id) => (indegree.get(id) ?? 0) === 0);
  if (queue.length === 0 && ids.length > 0) queue.push(ids[0]!);
  queue.forEach((id) => layer.set(id, 0));

  let cursor = 0;
  while (cursor < queue.length) {
    const current = queue[cursor++]!;
    const currentLayer = layer.get(current) ?? 0;
    for (const next of adjacency.get(current) ?? []) {
      const candidate = currentLayer + 1;
      if (!layer.has(next) || candidate > (layer.get(next) ?? 0)) {
        layer.set(next, candidate);
        if (!queue.includes(next)) queue.push(next);
      }
    }
  }
  // Anything unreached (disconnected node) just sits in layer 0.
  ids.forEach((id) => {
    if (!layer.has(id)) layer.set(id, 0);
  });

  const maxLayer = Math.max(0, ...Array.from(layer.values()));
  const byLayer = new Map<number, string[]>();
  ids.forEach((id) => {
    const l = layer.get(id) ?? 0;
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l)!.push(id);
  });

  const positions = new Map<string, Point>();
  byLayer.forEach((idsInLayer, l) => {
    const x = maxLayer === 0 ? 50 : 8 + (l / maxLayer) * 84;
    idsInLayer.forEach((id, idx) => {
      const y = ((idx + 1) / (idsInLayer.length + 1)) * 100;
      positions.set(id, { x, y });
    });
  });
  return positions;
}

function toViewBoxCoords(xPct: number, yPct: number) {
  const innerW = VIEWBOX_W - INSET * 2;
  const innerH = VIEWBOX_H - INSET * 2;
  return {
    x: INSET + (xPct / 100) * innerW,
    y: INSET + (yPct / 100) * innerH,
  };
}

export function Topology({
  topology,
  interactive = false,
  activeNodeId,
  onNodeClick,
  highlightedNodeIds,
  pulseNodeId,
}: {
  topology: TopologyDto;
  interactive?: boolean;
  activeNodeId?: string;
  onNodeClick?: (id: string) => void;
  /** Nodes implicated by any telemetry revealed so far this attempt — see the design
   * guide's recommendation that the diagram should visibly react to what's been
   * investigated, not sit static the whole attempt. Matched by
   * matchNodeIdForSource below, not required to be exact-equal to a node id. */
  highlightedNodeIds?: Set<string>;
  /** The node implicated by the MOST RECENTLY revealed telemetry specifically — gets
   * a one-shot pulse instead of (or in addition to) the steady highlight, so the
   * newest reveal has a distinct moment rather than blending into prior highlights. */
  pulseNodeId?: string;
}) {
  const positions = computeLayout(topology);

  return (
    <div className={`topology${interactive ? ' play-topology' : ''}`}>
      <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
        {topology.edges.map((edge) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const a = toViewBoxCoords(from.x, from.y);
          const b = toViewBoxCoords(to.x, to.y);
          return <line key={`${edge.from}-${edge.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </svg>
      {topology.nodes.map((node) => {
        const pos = positions.get(node.id) ?? { x: 50, y: 50 };
        const implicated = highlightedNodeIds?.has(node.id) ?? false;
        const pulsing = pulseNodeId === node.id;
        const classNames = [
          'node',
          activeNodeId === node.id && 'active',
          implicated && 'implicated',
          pulsing && 'pulse',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={node.id}
            type="button"
            className={classNames}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={interactive ? () => onNodeClick?.(node.id) : undefined}
            disabled={!interactive}
            title={node.type}
          >
            {node.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Matches a telemetry event's `source` string to a topology node id. Not required to
 * be an exact match — scenario authors write `source` as a free-text field describing
 * where a signal came from (e.g. "payments-db-primary"), which won't always be
 * byte-identical to a node id ("payments-db"). Falls back through exact match →
 * case-insensitive match → substring-contains in either direction, and returns
 * undefined (no highlight) rather than guessing wrong if nothing reasonably matches —
 * a missed highlight is a minor cosmetic gap; a WRONG highlight would misrepresent the
 * scenario's own topology, which is worse.
 */
export function matchNodeIdForSource(topology: TopologyDto, source: string): string | undefined {
  const normalizedSource = source.trim().toLowerCase();
  if (!normalizedSource) return undefined;

  const exact = topology.nodes.find((n) => n.id === source);
  if (exact) return exact.id;

  const caseInsensitive = topology.nodes.find((n) => n.id.toLowerCase() === normalizedSource);
  if (caseInsensitive) return caseInsensitive.id;

  const substring = topology.nodes.find(
    (n) => normalizedSource.includes(n.id.toLowerCase()) || n.id.toLowerCase().includes(normalizedSource)
  );
  return substring?.id;
}
