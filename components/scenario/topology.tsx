'use client';

import { useState } from 'react';
import type { TopologyDto, NodeDto } from '@/lib/types';

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
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#A3E635] shadow-[0_0_8px_#A3E635]" />
          <span className="text-xs font-mono text-neutral-300 font-semibold uppercase tracking-wider">
            System Topology
          </span>
        </div>
        <span className="text-[11px] font-mono text-neutral-500">
          {topology.nodes.length} Components · {topology.edges.length} Connections
        </span>
      </div>

      {/* System Node Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto overscroll-contain pr-1">
        {topology.nodes.map((node) => {
          const isActive = effectiveActiveId === node.id;
          const isImplicated = highlightedNodeIds?.has(node.id) ?? false;
          const isPulsing = pulseNodeId === node.id;
          const category = getNodeCategory(node);

          // Find connected neighbors
          const nodeInbound = topology.edges.filter((e) => e.to === node.id).length;
          const nodeOutbound = topology.edges.filter((e) => e.from === node.id).length;

          return (
            <div
              key={node.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(node.id)}
              className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-[#18181B] border-[#A3E635] shadow-[0_0_15px_rgba(163,230,53,0.2)]'
                  : isImplicated
                  ? 'bg-[#141417] border-[#A3E635]/60 hover:border-[#A3E635]'
                  : 'bg-[#111113] border-neutral-800 hover:border-neutral-700'
              } ${isPulsing ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
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
                    <div className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-[#A3E635]' : 'text-white'}`}>
                      {node.label}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 mt-0.5 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-neutral-800/80 text-neutral-300">
                        {node.type.toUpperCase()}
                      </span>
                      <span className="text-neutral-500 truncate">{node.id}</span>
                    </div>
                  </div>
                </div>

                {isImplicated && (
                  <span className="shrink-0 text-[10px] font-mono font-bold text-[#A3E635] bg-[#A3E635]/10 px-2 py-0.5 rounded border border-[#A3E635]/30 animate-pulse">
                    ⚡ SIGNAL
                  </span>
                )}
              </div>

              {/* Connections Footer */}
              <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                <span>In: {nodeInbound}</span>
                <span>Out: {nodeOutbound}</span>
                <span className="text-neutral-400 hover:text-white">
                  {isActive ? 'Selected' : 'Inspect →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Details Drawer / Popover */}
      {selectedNode && (
        <div className="mt-3.5 p-3.5 bg-[#161618] border border-neutral-700/80 rounded-xl animate-in fade-in duration-200 shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white font-mono truncate">{selectedNode.label}</span>
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
            <div className="mt-2.5 text-[11px] font-mono text-[#A3E635] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
              Telemetry signal detected on this component — check the Telemetry stream.
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


