const API = '/api/v1';
const TOKEN_KEY = 'auth_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function req(method, path, body) {
  const opts = { method, headers: getHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/asset-sanitation/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail?.error || err.detail?.message || err.detail || res.statusText);
  }
  return res.json();
}

// ── Auth helpers ──────────────────────────────────────────────

export async function getSession() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: getHeaders(),
    });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { username: data.username };
  } catch {
    return null;
  }
}

export async function login(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usr: username, pwd: password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  return { username: data.username };
}

export async function logout() {
  const token = getToken();
  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/asset-sanitation/login';
  }
}

// ── Workstations ─────────────────────────────────────────────

export async function getWorkstations() {
  return req('GET', '/workstations/');
}

export async function createWorkstation(data) {
  return req('POST', '/workstations/', data);
}

export async function updateWorkstation(id, data) {
  return req('PUT', `/workstations/${id}/`, data);
}

export async function deleteWorkstation(id) {
  return req('DELETE', `/workstations/${id}/`);
}

// ── Asset Groups ─────────────────────────────────────────────

export async function getAssetGroups() {
  return req('GET', '/asset-groups/');
}

export async function getAssetGroup(id) {
  return req('GET', `/asset-groups/${id}/`);
}

export async function createAssetGroup(data) {
  return req('POST', '/asset-groups/', data);
}

export async function updateAssetGroup(id, data) {
  return req('PUT', `/asset-groups/${id}/`, data);
}

export async function deleteAssetGroup(id) {
  return req('DELETE', `/asset-groups/${id}/`);
}

export async function getAssetGroupStats(id) {
  return req('GET', `/asset-groups/${id}/stats/`);
}

// ── Asset Group Assets (junction table) ───────────────────

export async function getGroupAssets(ag_id) {
  return req('GET', `/asset-groups/${ag_id}/assets`);
}

export async function addAssetsToGroup(ag_id, erp_asset_ids) {
  return req('POST', `/asset-groups/${ag_id}/assets`, { erp_asset_ids });
}

export async function removeAssetFromGroup(ag_id, erp_asset_id) {
  return req('DELETE', `/asset-groups/${ag_id}/assets/${erp_asset_id}`);
}

// ── Sanitation Orders ────────────────────────────────────────

export async function getSanitationOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `/sanitation-orders/${qs ? '?' + qs : ''}`);
}

export async function getSanitationOrder(id) {
  return req('GET', `/sanitation-orders/${id}`);
}

export async function createSanitationOrder(data) {
  return req('POST', '/sanitation-orders/', data);
}

export async function updateSanitationOrder(id, data) {
  return req('PUT', `/sanitation-orders/${id}/`, data);
}

export async function deleteSanitationOrder(id) {
  return req('DELETE', `/sanitation-orders/${id}/`);
}

export async function startSanitationOrder(id) {
  return req('POST', `/sanitation-orders/${id}/start/`);
}

export async function completeSanitationOrder(id) {
  return req('POST', `/sanitation-orders/${id}/complete/`);
}

export async function cancelSanitationOrder(id) {
  return req('POST', `/sanitation-orders/${id}/cancel/`);
}

// ── Stats ────────────────────────────────────────────────────

export async function getStats() {
  return req('GET', '/stats/');
}

// ── ERP Assets (local cache for group linking) ───────────────────────

export async function getErpAssets() {
  return req('GET', '/erp-assets');
}

export async function getErpAsset(name) {
  return req('GET', `/assets/${encodeURIComponent(name)}/`);
}

export async function getErpItems(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `/items${qs ? '?' + qs : ''}`);
}

export async function getErpItem(name) {
  return req('GET', `/items/${encodeURIComponent(name)}`);
}

export async function getErpBoms(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `/boms/${qs ? '?' + qs : ''}`);
}

export async function getErpBom(name) {
  return req('GET', `/boms/${encodeURIComponent(name)}`);
}

export async function getBomItems(name) {
  return req('GET', `/boms/${encodeURIComponent(name)}/items`);
}

export async function getBomWorkOrders(name) {
  return req('GET', `/boms/${encodeURIComponent(name)}/work-orders`);
}

export async function getErpWorkOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `/work-orders/${qs ? '?' + qs : ''}`);
}

export async function getErpWorkOrder(name) {
  return req('GET', `/work-orders/${encodeURIComponent(name)}/`);
}

export async function getErpWorkstations(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `/erp-workstations/${qs ? '?' + qs : ''}`);
}
