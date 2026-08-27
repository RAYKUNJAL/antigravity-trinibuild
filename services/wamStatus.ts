/**
 * Client-side Wam status. Never reads a key. Never invents a charge.
 * GET /api/wam/status is fail-closed when WAM_API_KEY is unset on the server.
 */

export interface WamStatus {
  configured: boolean;
}

export async function fetchWamStatus(): Promise<WamStatus> {
  try {
    const res = await fetch('/api/wam/status', { headers: { Accept: 'application/json' } });
    if (!res.ok) return { configured: false };
    const data = await res.json();
    return { configured: data.configured === true };
  } catch {
    return { configured: false };
  }
}
