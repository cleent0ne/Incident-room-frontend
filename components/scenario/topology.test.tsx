import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { matchNodeIdForSource, getNodeCategory, Topology } from './topology';
import type { TopologyDto } from '@/lib/types';

const topology: TopologyDto = {
  nodes: [
    { id: 'payments-db', type: 'database', label: 'Payments DB' },
    { id: 'checkout-api', type: 'service', label: 'Checkout API' },
    { id: 'api-gateway', type: 'service', label: 'API Gateway' },
    { id: 'event-queue', type: 'queue', label: 'Event Queue' },
  ],
  edges: [
    { from: 'api-gateway', to: 'checkout-api' },
    { from: 'checkout-api', to: 'payments-db' },
    { from: 'checkout-api', to: 'event-queue' },
  ],
};

describe('matchNodeIdForSource', () => {
  it('matches an exact source string to a node id', () => {
    expect(matchNodeIdForSource(topology, 'payments-db')).toBe('payments-db');
  });

  it('matches case-insensitively', () => {
    expect(matchNodeIdForSource(topology, 'PAYMENTS-DB')).toBe('payments-db');
  });

  it('matches when the source is a more specific superstring of a node id', () => {
    expect(matchNodeIdForSource(topology, 'payments-db-primary')).toBe('payments-db');
  });

  it('matches when the node id is a superstring of the source', () => {
    expect(matchNodeIdForSource(topology, 'checkout')).toBe('checkout-api');
  });

  it('returns undefined rather than guessing when nothing reasonably matches', () => {
    expect(matchNodeIdForSource(topology, 'auth-service')).toBeUndefined();
  });

  it('returns undefined for an empty or whitespace-only source', () => {
    expect(matchNodeIdForSource(topology, '   ')).toBeUndefined();
  });
});

describe('getNodeCategory', () => {
  it('identifies database nodes', () => {
    expect(getNodeCategory({ id: 'pg-1', type: 'postgres', label: 'Primary DB' })).toBe('database');
  });

  it('identifies gateway nodes', () => {
    expect(getNodeCategory({ id: 'ingress', type: 'gateway', label: 'Edge Ingress' })).toBe('gateway');
  });

  it('identifies queue nodes', () => {
    expect(getNodeCategory({ id: 'kafka-bus', type: 'queue', label: 'Order Bus' })).toBe('queue');
  });

  it('defaults to service for generic components', () => {
    expect(getNodeCategory({ id: 'worker', type: 'service', label: 'Sync Worker' })).toBe('service');
  });
});

describe('Topology Component', () => {
  it('renders node count and view toggle buttons', () => {
    render(<Topology topology={topology} />);
    expect(screen.getByText(/4 nodes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /diagram/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cards/i })).toBeInTheDocument();
  });

  it('switches to cards view on toggle', () => {
    render(<Topology topology={topology} />);
    const cardsBtn = screen.getByRole('button', { name: /cards/i });
    fireEvent.click(cardsBtn);
    expect(screen.getByText('Payments DB')).toBeInTheDocument();
    expect(screen.getByText('Checkout API')).toBeInTheDocument();
  });

  it('triggers onNodeClick when interactive node is clicked', () => {
    const onNodeClick = vi.fn();
    render(<Topology topology={topology} interactive onNodeClick={onNodeClick} />);
    const cardsBtn = screen.getByRole('button', { name: /cards/i });
    fireEvent.click(cardsBtn);
    const nodeCard = screen.getByText('Payments DB');
    fireEvent.click(nodeCard);
    expect(onNodeClick).toHaveBeenCalledWith('payments-db');
  });
});

