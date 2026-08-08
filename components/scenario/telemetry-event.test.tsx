import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TelemetryPayload } from './telemetry-event';
import type { TelemetryEventDto } from '@/lib/types';

function event(overrides: Partial<TelemetryEventDto>): TelemetryEventDto {
  return {
    t: 0,
    type: 'LOG',
    source: 'checkout-api',
    payload: {},
    ...overrides,
  };
}

describe('TelemetryPayload', () => {
  it('renders a LOG event with level and message, applying the error style for ERROR level', () => {
    const { container } = render(
      <TelemetryPayload
        event={event({
          type: 'LOG',
          payload: { level: 'ERROR', message: 'connection pool exhausted', pool: 'checkout-db' },
        })}
      />
    );

    expect(screen.getByText('ERROR')).toBeInTheDocument();
    expect(screen.getByText('connection pool exhausted')).toBeInTheDocument();
    expect(screen.getByText('pool=checkout-db')).toBeInTheDocument();
    expect(container.querySelector('.log.error')).not.toBeNull();
  });

  it('renders a LOG event at WARN level with the warn style, not the error style', () => {
    const { container } = render(
      <TelemetryPayload event={event({ type: 'LOG', payload: { level: 'WARN', message: 'latency rising' } })} />
    );

    expect(container.querySelector('.log.warn')).not.toBeNull();
    expect(container.querySelector('.log.error')).toBeNull();
  });

  it('renders a METRIC_POINT event with name and value emphasized', () => {
    render(
      <TelemetryPayload
        event={event({ type: 'METRIC_POINT', payload: { name: 'p99_latency_ms', value: 4200 } })}
      />
    );

    expect(screen.getByText('p99_latency_ms', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('4200')).toBeInTheDocument();
  });

  it('renders a TRACE_SPAN event as key/value chips', () => {
    render(
      <TelemetryPayload
        event={event({ type: 'TRACE_SPAN', payload: { key: 'checkout:123', ttl_seconds: 30, jitter: false } })}
      />
    );

    expect(screen.getByText('key')).toBeInTheDocument();
    expect(screen.getByText('checkout:123')).toBeInTheDocument();
    expect(screen.getByText('ttl_seconds')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('falls back to a generic dump for a LOG payload missing the expected `message` field', () => {
    const { container } = render(
      <TelemetryPayload event={event({ type: 'LOG', payload: { unexpected: 'shape' } })} />
    );

    expect(container.textContent).toContain('unexpected');
    expect(container.textContent).toContain('shape');
  });
});
