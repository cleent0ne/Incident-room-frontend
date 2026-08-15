'use client';

import { useState } from 'react';
import type { TopologyDto, NodeDto } from '@/lib/types';

const VIEWBOX_W = 540;
const VIEWBOX_H = 290;
const NODE_W = 128;
const NODE_H = 56;

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
  const marginX = 85;
  const usableW = VIEWBOX_W - marginX * 2;

  byLayer.forEach((idsInLayer, l) => {
    const x = maxLayer === 0 ? VIEWBOX_W / 2 : marginX + (l / maxLayer) * usableW;
    const marginY = 55;
    const usableH = VIEWBOX_H - marginY * 2;
    idsInLayer.forEach((id, idx) => {
      const y = marginY + ((idx + 1) / (idsInLayer.length + 1)) * usableH;
      positions.set(id, { x, y });
    });
  });

  return positions;
}

export function getNodeCategory(node: NodeDto): 'database' | 'service' | 'gateway' | 'queue' {
  const typeLower = (node.type || '').toLowerCase();
  const idLower = (node.id || '').toLowerCase();
  const labelLower = (node.label || '').toLowerCase();
  const combined = `${typeLower} ${idLower} ${labelLower}`;

  if (
    combined.includes('db') ||
    combined.includes('database') ||
    combined.includes('postgres') ||
    combined.includes('redis') ||
    combined.includes('mongo')
  ) {
    return 'database';
  }
  if (
    combined.includes('gateway') ||
    combined.includes('ingress') ||
    combined.includes('frontend') ||
    combined.includes('web') ||
    combined.includes('ui')
  ) {
    return 'gateway';
  }
  if (
    combined.includes('queue') ||
    combined.includes('kafka') ||
    combined.includes('rabbit') ||
    combined.includes('sqs') ||
    combined.includes('pubsub')
  ) {
    return 'queue';
  }
  return 'service';
}

export function FlowchartIcon({ category }: { category: 'database' | 'service' | 'gateway' | 'queue' }) {
  switch (category) {
    case 'database':
      return (
        <path
          d="M12 2C6.48 2 2 3.79 2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0-2.21-4.48-4-10-4zm0 2c4.42 0 8 1.34 8 2s-3.58 2-8 2-8-1.34-8-2 3.58-2 8-2zm0 5c4.42 0 8 1.34 8 2v3c0 .66-3.58 2-8 2s-8-1.34-8-2v-3c0-.66 3.58-2 8-2zm0 7c4.42 0 8 1.34 8 2v3c0 .66-3.58 2-8 2s-8-1.34-8-2v-3c0-.66 3.58-2 8-2z"
          fill="currentColor"
        />
      );
    case 'gateway':
      return (
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
          fill="currentColor"
        />
      );
    case 'queue':
      return <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" fill="currentColor" />;
    case 'service':
    default:
      return (
        <path
          d="M19 13H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM19 3H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
          fill="currentColor"
        />
      );
  }
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
  highlightedNodeIds?: Set<string>;
  pulseNodeId?: string;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [mode, setMode] = useState<'flowchart' | 'cards'>('flowchart');
  const positions = computeLayout(topology);

  const effectiveActiveId = activeNodeId || selectedNodeId;
  const selectedNode = topology.nodes.find((n) => n.id === effectiveActiveId);

  const upstreamNodes = selectedNode
    ? topology.edges.filter((e) => e.to === selectedNode.id).map((e) => e.from)
    : [];
  const downstreamNodes = selectedNode
    ? topology.edges.filter((e) => e.from === selectedNode.id).map((e) => e.to)
    : [];

  function handleSelect(id: string) {
    setSelectedNodeId((prev) => (prev === id ? null : id));
    if (interactive && onNodeClick) {
      onNodeClick(id);
    }
  }

  return (
    <div className={`relative w-full rounded-2xl bg-[#0A0A0A] border border-neutral-800 p-3 sm:p-4 shadow-xl overflow-hidden ${interactive ? 'play-topology' : ''}`}>
      
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5 mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 shrink-0 rounded-full bg-[#A3E635] shadow-[0_0_8px_#A3E635]" />
          <span className="text-[11px] font-mono text-neutral-400 font-semibold uppercase tracking-wider truncate">
            Topology
          </span>
          <span className="hidden xs:inline-block text-[10px] font-mono text-neutral-500">
            ({topology.nodes.length} nodes)
          </span>
        </div>

        {/* View Mode Toggle (Graph vs List Cards) */}
        <div className="flex items-center bg-[#141416] p-0.5 rounded-lg border border-neutral-800 shrink-0">
          <button
            type="button"
            className={`px-2.5 py-1 text-[10px] sm:text-xs font-mono rounded-md transition-all ${
              mode === 'flowchart'
                ? 'bg-[#A3E635] text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            onClick={() => setMode('flowchart')}
            title="Interactive Flowchart Diagram"
          >
            Diagram
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 text-[10px] sm:text-xs font-mono rounded-md transition-all ${
              mode === 'cards'
                ? 'bg-[#A3E635] text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            onClick={() => setMode('cards')}
            title="Touch-Friendly System Cards"
          >
            Cards
          </button>
        </div>
      </div>

      {mode === 'flowchart' ? (
        /* Flowchart SVG Surface with smooth horizontal touch-scroll */
        <div className="w-full overflow-x-auto overscroll-x-contain pb-1 scrollbar-thin">
          <div className="min-w-[340px] sm:min-w-[480px]">
            <svg viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className="w-full h-auto block select-none">
              <defs>
                <marker
                  id="flowchart-arrow-default"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#4B5563" />
                </marker>

                <marker
                  id="flowchart-arrow-active"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#A3E635" />
                </marker>
              </defs>

              {/* Render Edge Connector Paths */}
              {topology.edges.map((edge) => {
                const from = positions.get(edge.from);
                const to = positions.get(edge.to);
                if (!from || !to) return null;

                const x1 = from.x + NODE_W / 2;
                const y1 = from.y;
                const x2 = to.x - NODE_W / 2;
                const y2 = to.y;

                const deltaX = Math.max(30, Math.abs(x2 - x1) * 0.5);
                const cx1 = x1 + deltaX;
                const cy1 = y1;
                const cx2 = x2 - deltaX;
                const cy2 = y2;
                const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

                const isEdgeHighlighted =
                  (highlightedNodeIds?.has(edge.from) && highlightedNodeIds?.has(edge.to)) ||
                  effectiveActiveId === edge.from ||
                  effectiveActiveId === edge.to;

                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isEdgeHighlighted ? '#A3E635' : '#374151'}
                      strokeWidth={isEdgeHighlighted ? 2.5 : 1.75}
                      markerEnd={isEdgeHighlighted ? 'url(#flowchart-arrow-active)' : 'url(#flowchart-arrow-default)'}
                      opacity={isEdgeHighlighted ? 0.95 : 0.65}
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isEdgeHighlighted ? '#A3E635' : '#9CA3AF'}
                      strokeWidth={1.5}
                      className="flowchart-line-animated"
                      opacity={isEdgeHighlighted ? 0.9 : 0.4}
                    />
                  </g>
                );
              })}

              {/* Render Flowchart Node Blocks */}
              {topology.nodes.map((node) => {
                const pos = positions.get(node.id) ?? { x: 50, y: 50 };
                const isActive = effectiveActiveId === node.id;
                const isImplicated = highlightedNodeIds?.has(node.id) ?? false;
                const isPulsing = pulseNodeId === node.id;
                const category = getNodeCategory(node);

                const strokeColor = isActive || isImplicated ? '#A3E635' : '#27272A';
                const strokeWidth = isActive ? 2.5 : isImplicated ? 2 : 1;
                const fillColor = isActive ? '#18181B' : '#121214';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x - NODE_W / 2}, ${pos.y - NODE_H / 2})`}
                    className="group transition-transform duration-200 cursor-pointer"
                    onClick={() => handleSelect(node.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${node.label} (${node.type})`}
                  >
                    {(isPulsing || isActive) && (
                      <rect
                        x={-4}
                        y={-4}
                        width={NODE_W + 8}
                        height={NODE_H + 8}
                        rx={12}
                        fill="none"
                        stroke="#A3E635"
                        strokeWidth="2"
                        className="animate-ping opacity-40"
                      />
                    )}

                    <rect
                      x={0}
                      y={0}
                      width={NODE_W}
                      height={NODE_H}
                      rx={10}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      className={`transition-all duration-200 group-hover:stroke-[#A3E635] ${
                        isActive ? 'shadow-[0_0_20px_rgba(163,230,53,0.35)]' : ''
                      }`}
                    />

                    {/* Icon Circular Wrapper */}
                    <g transform="translate(10, 16)">
                      <circle
                        cx={12}
                        cy={12}
                        r={12}
                        fill={isActive || isImplicated ? 'rgba(163,230,53,0.15)' : 'rgba(255,255,255,0.05)'}
                        stroke={isActive || isImplicated ? 'rgba(163,230,53,0.4)' : 'rgba(255,255,255,0.1)'}
                        strokeWidth="1"
                      />
                      <g transform="translate(4, 4) scale(0.65)" className={isActive || isImplicated ? 'text-[#A3E635]' : 'text-neutral-400'}>
                        <FlowchartIcon category={category} />
                      </g>
                    </g>

                    {/* Node Label */}
                    <text
                      x={40}
                      y={25}
                      fill={isActive ? '#A3E635' : '#FFFFFF'}
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="sans-serif"
                      className="group-hover:fill-[#A3E635] transition-colors"
                    >
                      {node.label.length > 13 ? `${node.label.slice(0, 12)}…` : node.label}
                    </text>

                    {/* Node Type Pill Badge */}
                    <text
                      x={40}
                      y={40}
                      fill="#9CA3AF"
                      fontSize="9.5"
                      fontWeight="500"
                      fontFamily="monospace"
                      letterSpacing="0.04em"
                    >
                      {node.type.toUpperCase()}
                    </text>

                    {/* Implicated / Active Indicator Marker */}
                    {isImplicated && (
                      <circle cx={NODE_W - 10} cy={10} r={4} fill="#A3E635" className="animate-pulse" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* Mobile Touch-Friendly Node Cards List */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto overscroll-contain pr-1">
          {topology.nodes.map((node) => {
            const isActive = effectiveActiveId === node.id;
            const isImplicated = highlightedNodeIds?.has(node.id) ?? false;
            const isPulsing = pulseNodeId === node.id;
            const category = getNodeCategory(node);

            return (
              <div
                key={node.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(node.id)}
                className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#18181B] border-[#A3E635] shadow-[0_0_15px_rgba(163,230,53,0.2)]'
                    : isImplicated
                    ? 'bg-[#141417] border-[#A3E635]/60'
                    : 'bg-[#111113] border-neutral-800 hover:border-neutral-700'
                } ${isPulsing ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center border ${
                    isActive || isImplicated
                      ? 'bg-[#A3E635]/15 border-[#A3E635]/40 text-[#A3E635]'
                      : 'bg-white/5 border-white/10 text-neutral-400'
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <FlowchartIcon category={category} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold truncate ${isActive ? 'text-[#A3E635]' : 'text-white'}`}>
                      {node.label}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                      {node.type.toUpperCase()} · <span className="text-neutral-500">{node.id}</span>
                    </div>
                  </div>
                </div>

                {isImplicated && (
                  <span className="shrink-0 text-[10px] font-mono font-bold text-[#A3E635] bg-[#A3E635]/10 px-2 py-0.5 rounded border border-[#A3E635]/30">
                    SIGNAL
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Node Details Drawer / Popover */}
      {selectedNode && (
        <div className="mt-3 p-3 bg-[#161618] border border-neutral-700/80 rounded-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-white font-mono truncate">{selectedNode.label}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-[#A3E635]">
                {selectedNode.type}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800/80"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-[11px] font-mono text-neutral-300">
            <div>
              <span className="text-neutral-500">Inbound traffic: </span>
              {upstreamNodes.length > 0 ? (
                <span className="text-neutral-200">{upstreamNodes.join(', ')}</span>
              ) : (
                <span className="text-neutral-600">None (Entrypoint)</span>
              )}
            </div>
            <div>
              <span className="text-neutral-500">Outbound to: </span>
              {downstreamNodes.length > 0 ? (
                <span className="text-neutral-200">{downstreamNodes.join(', ')}</span>
              ) : (
                <span className="text-neutral-600">None (Terminal)</span>
              )}
            </div>
          </div>

          {highlightedNodeIds?.has(selectedNode.id) && (
            <div className="mt-2 text-[11px] font-mono text-[#A3E635] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
              Telemetry event detected for this node — inspect the Telemetry log.
            </div>
          )}
        </div>
      )}

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


