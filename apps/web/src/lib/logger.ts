export function log(event: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

export function logError(event: string, err: unknown, data?: Record<string, unknown>) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(JSON.stringify({ ts: new Date().toISOString(), event, level: 'error', error: message, stack, ...data }));
}
