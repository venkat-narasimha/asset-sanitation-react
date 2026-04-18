const API_BASE = 'https://pbapps.duckdns.org/api/v1';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const msg = typeof err.detail === 'string' ? err.detail
      : err.detail?.error || err.detail?.message || JSON.stringify(err.detail || err)
      || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Workstations ────────────────────────────────────────────────

export async function getWorkstations(isActive = undefined) {
  const params = isActive !== undefined ? `?is_active=${isActive}` : '';
  const data = await request('GET', `/workstations${params}`);
  return data.data || [];
}

export async function getWorkstation(id) {
  return request('GET', `/workstations/${id}`);
}

export async function createWorkstation(payload) {
  return request('POST', '/workstations', payload);
}

export async function updateWorkstation(id, payload) {
  return request('PUT', `/workstations/${id}`, payload);
}

export async function deleteWorkstation(id) {
  return request('DELETE', `/workstations/${id}`);
}

// ─── Sanitation Orders ────────────────────────────────────────────

export async function getSanitationOrders({ status, assetGroupId, fromDate, toDate } = {}) {
  const p = new URLSearchParams();
  if (status) p.set('status', status);
  if (assetGroupId) p.set('asset_group_id', assetGroupId);
  if (fromDate) p.set('from_date', fromDate);
  if (toDate) p.set('to_date', toDate);
  const qs = p.toString();
  const data = await request('GET', `/sanitation-orders${qs ? `?${qs}` : ''}`);
  return data.data || [];
}

export async function getSanitationOrder(id) {
  return request('GET', `/sanitation-orders/${id}`);
}

export async function updateSanitationOrder(id, payload) {
  return request('PUT', `/sanitation-orders/${id}`, payload);
}

export async function completeSanitationOrder(id, payload) {
  return request('POST', `/sanitation-orders/${id}/complete`, payload);
}

export async function deleteSanitationOrder(id) {
  return request('DELETE', `/sanitation-orders/${id}`);
}

// ─── Utilities ───────────────────────────────────────────────────

export function statusClass(status) {
  switch (status) {
    case 'Pending': return 'badge-pending';
    case 'In Progress': return 'badge-in-progress';
    case 'Completed': return 'badge-completed';
    default: return '';
  }
}

export function typeClass(type) {
  switch (type) {
    case 'Allergen-specific': return 'badge-allergen';
    case 'Normal': return 'badge-normal';
    case 'Thorough': return 'badge-thorough';
    default: return '';
  }
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── WO Lookup ──────────────────────────────────────────────────

export async function lookupWorkOrder(woName) {
  return request('GET', `/sanitation/wo-lookup/${encodeURIComponent(woName)}`);
}

export async function checkBlocking(woName) {
  return request('GET', `/sanitation/blocking-status/${encodeURIComponent(woName)}`);
}


export async function getWorkOrders() {
  const data = await request('GET', '/sanitation/wo-list');
  return data.data || [];
}

export async function triggerSanitation(woName) {
  return request('POST', `/sanitation/trigger/${encodeURIComponent(woName)}`);
}

// ─── Dashboard Stats ──────────────────────────────────────────────

export async function getSanitationStats() {
  return request('GET', '/sanitation/stats');
}

export async function getRecentOrders(limit = 5) {
  const data = await request('GET', `/sanitation-orders?limit=${limit}&status=Completed`);
  return data.data || [];
}

export async function getPendingActions(limit = 5) {
  const data = await request('GET', '/sanitation-orders?status_pending=1&status_in_progress=1');
  return (data.data || []).slice(0, limit);
}
