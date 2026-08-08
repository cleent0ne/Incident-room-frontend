import type { TelemetryEventDto } from '@/lib/types';

/**
 * Renders a revealed telemetry event according to its `type`, instead of the flat
 * `JSON.stringify(event.payload)` the play screen used to fall back to for every kind
 * of signal. The mechanic underneath (gated reveals, investigate costs) already does
 * the work of making this feel like a real incident; this is what makes the telemetry
 * itself read like a log line / metric / trace span instead of a debug dump — see the
 * product analysis, gap 3.4.
 *
 * Payloads are authored content with a flexible shape (see TelemetryEvent.java's
 * payload javadoc) — every accessor here degrades to a generic key/value dump if the
 * fields a given type "usually" has aren't present, so an oddly-shaped payload never
 * renders as nothing.
 */
export function TelemetryPayload({ event }: { event: TelemetryEventDto }) {
  switch (event.type) {
    case 'LOG':
      return <LogPayload payload={event.payload} />;
    case 'METRIC_POINT':
      return <MetricPayload payload={event.payload} />;
    case 'TRACE_SPAN':
      return <TracePayload payload={event.payload} />;
    default:
      return <GenericPayload payload={event.payload} />;
  }
}

function levelClass(level: unknown): string {
  const normalized = typeof level === 'string' ? level.toUpperCase() : '';
  if (normalized === 'ERROR' || normalized === 'FATAL') return 'log error';
  if (normalized === 'WARN' || normalized === 'WARNING') return 'log warn';
  return 'log';
}

function LogPayload({ payload }: { payload: Record<string, unknown> }) {
  const { level, message, ...rest } = payload;
  if (typeof message !== 'string') {
    return <GenericPayload payload={payload} />;
  }
  const restEntries = Object.entries(rest);
  return (
    <div className={levelClass(level)}>
      {typeof level === 'string' && <span className="log-level">{level.toUpperCase()}</span>}
      <span>{message}</span>
      {restEntries.length > 0 && (
        <div className="log-fields">
          {restEntries.map(([key, value]) => (
            <span key={key}>
              {key}={formatValue(value)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricPayload({ payload }: { payload: Record<string, unknown> }) {
  const { name, value, ...rest } = payload;
  if (typeof name !== 'string' || value === undefined) {
    return <GenericPayload payload={payload} />;
  }
  const restEntries = Object.entries(rest);
  return (
    <div>
      <div className="metric">
        {name} <span className="metric-value">{formatValue(value)}</span>
      </div>
      {restEntries.length > 0 && (
        <div className="log-fields">
          {restEntries.map(([key, v]) => (
            <span key={key}>
              {key}={formatValue(v)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TracePayload({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload);
  return (
    <div className="trace">
      {entries.map(([key, value]) => (
        <span key={key} className="trace-field">
          <span className="trace-key">{key}</span>
          <span className="trace-value">{formatValue(value)}</span>
        </span>
      ))}
    </div>
  );
}

function GenericPayload({ payload }: { payload: Record<string, unknown> }) {
  return <div className="log">{JSON.stringify(payload)}</div>;
}

function formatValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  return JSON.stringify(value);
}
