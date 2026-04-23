import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || ''

async function fetchBoms({ item, isActive, allergen, search } = {}) {
  const token = localStorage.getItem('token')
  const params = new URLSearchParams()
  if (item) params.set('item', item)
  if (isActive) params.set('is_active', isActive)
  if (allergen) params.set('allergen', 'true')
  if (search) params.set('search', search)
  const res = await fetch(`${API}/api/v1/erp/boms?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function fetchBom(bomName) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/api/v1/erp/boms/${bomName}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function fetchItems() {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/api/v1/erp/items`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function createBom(data) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/api/v1/erp/boms`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Create failed')
  }
  return res.json()
}

async function updateBom(bomName, data) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/api/v1/erp/boms/${bomName}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Update failed')
  }
  return res.json()
}

async function disableBom(bomName) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}/api/v1/erp/boms/${bomName}/disable`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Disable failed')
  }
  return res.json()
}

function parseAllergens(raw) {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export default function BOMs() {
  const [boms, setBoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterAllergen, setFilterAllergen] = useState(false)
  const [items, setItems] = useState([])
  const [modal, setModal] = useState(null)
  const [detailBom, setDetailBom] = useState(null)
  const [editBom, setEditBom] = useState(null)
  const [form, setForm] = useState({ bom_no: '', item: '', is_active: true, custom_is_allergen: false, custom_bom_allergen_items: '' })
  const [formError, setFormError] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBoms()
      setBoms(data.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await fetchBoms({ search, allergen: filterAllergen ? 'true' : undefined })
      setBoms(data.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function openCreate() {
    setEditBom(null)
    setForm({ bom_no: '', item: '', is_active: true, custom_is_allergen: false, custom_bom_allergen_items: '' })
    setFormError(null)
    setModal('form')
    try {
      const data = await fetchItems()
      setItems(data.data || [])
    } catch (e) {
      setItems([])
    }
  }

  function openEdit(bom) {
    setEditBom(bom)
    setForm({
      bom_no: bom.name,
      item: bom.item,
      is_active: !!bom.is_active,
      custom_is_allergen: !!bom.custom_is_allergen,
      custom_bom_allergen_items: (bom.custom_bom_allergen_items || '').replace(/[\[\]"]/g, '')
    })
    setFormError(null)
    setModal('form')
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    try {
      const allergensRaw = form.custom_bom_allergen_items || ''
      const allergenItems = allergensRaw.split(',').map(s => s.trim()).filter(Boolean)
      const payload = {
        item: form.item,
        is_active: form.is_active ? 1 : 0,
        custom_is_allergen: form.custom_is_allergen ? 1 : 0,
        custom_bom_allergen_items: allergenItems.length ? JSON.stringify(allergenItems) : '[]',
      }
      if (editBom) {
        await updateBom(editBom.name, payload)
      } else {
        await createBom({ ...payload, bom_no: form.bom_no || undefined })
      }
      setModal(null)
      await loadData()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDisable(bom) {
    if (!confirm(`Deactivate BOM "${bom.name}"?`)) return
    try {
      await disableBom(bom.name)
      await loadData()
    } catch (e) {
      alert(`Failed: ${e.message}`)
    }
  }

  async function handleRowClick(bom) {
    setDetailLoading(true)
    setDetailError(null)
    setDetailBom(null)
    setModal('detail')
    try {
      const data = await fetchBom(bom.name)
      setDetailBom(data.data || data)
    } catch (e) {
      setDetailError(e.message)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Bills of Materials</h2>
        <button onClick={openCreate} className="btn btn-primary">+ Create BOM</button>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by item name..."
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={filterAllergen} onChange={e => setFilterAllergen(e.target.checked)} />
          Allergen only
        </label>
        <button type="submit" className="btn btn-secondary">Search</button>
      </form>

      {error && <div style={{ color: '#dc2626', marginBottom: '16px' }}>Error: {error}</div>}

      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>BOM Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Item</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Allergen</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : boms.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No BOMs found</td></tr>
            ) : (
              boms.map(bom => {
                const allergens = parseAllergens(bom.custom_bom_allergen_items)
                const isAllergen = !!bom.custom_is_allergen
                return (
                  <tr key={bom.name} style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => handleRowClick(bom)}>
                    <td style={{ padding: '12px 16px' }}><code style={{ fontSize: '13px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{bom.name}</code></td>
                    <td style={{ padding: '12px 16px' }}>{bom.item || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {bom.is_active ? (
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>Active</span>
                      ) : (
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>Inactive</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isAllergen ? (
                        <span style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>
                          ⚠️ Yes {allergens.length ? `(${allergens.join(', ')})` : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '13px' }}>❌ No</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(bom)} style={{ marginRight: '8px', padding: '4px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Edit</button>
                      {bom.is_active ? (
                        <button onClick={() => handleDisable(bom)} style={{ padding: '4px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Disable</button>
                      ) : null}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {modal === 'detail' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModal(null)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 600 }}>BOM Detail</h3>
            {detailLoading ? (
              <p style={{ color: '#94a3b8' }}>Loading...</p>
            ) : detailError ? (
              <p style={{ color: '#dc2626' }}>Error: {detailError}</p>
            ) : detailBom ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div><strong>BOM Name:</strong><br /><code>{detailBom.name}</code></div>
                  <div><strong>Item:</strong><br />{detailBom.item || '—'}</div>
                  <div><strong>Status:</strong><br />{detailBom.is_active ? '✅ Active' : '❌ Inactive'}</div>
                  <div><strong>Allergen:</strong><br />
                    {detailBom.custom_is_allergen ? (
                      <span style={{ color: '#dc2626', fontWeight: 500 }}>⚠️ Yes — {parseAllergens(detailBom.custom_bom_allergen_items).join(', ') || 'items listed'}</span>
                    ) : '❌ No'}
                  </div>
                </div>
                {detailBom.bom_items && detailBom.bom_items.length > 0 && (
                  <div>
                    <strong>Ingredients:</strong>
                    <table style={{ width: '100%', marginTop: '8px', fontSize: '13px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item Code</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>UOM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailBom.bom_items || []).map((bi, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px' }}>{bi.item_code}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{bi.qty}</td>
                            <td style={{ padding: '8px 12px' }}>{bi.uom || 'Nos'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal === 'form' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 600 }}>{editBom ? 'Edit BOM' : 'Create BOM'}</h3>
            {formError && <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px', fontSize: '14px' }}>{formError}</div>}
            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                {!editBom && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                    BOM Name *
                    <input value={form.bom_no} onChange={e => setForm({ ...form, bom_no: e.target.value })} required pattern="[A-Za-z0-9_-]+" style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }} />
                  </label>
                )}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Item *
                  <select value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} required style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}>
                    <option value="">Select item...</option>
                    {items.map(it => <option key={it.name} value={it.name}>{it.item_name || it.name} ({it.name})</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.custom_is_allergen} onChange={e => setForm({ ...form, custom_is_allergen: e.target.checked })} />
                  Is Allergen BOM
                </label>
                {form.custom_is_allergen && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                    Allergen Items (comma-separated)
                    <input value={form.custom_bom_allergen_items} onChange={e => setForm({ ...form, custom_bom_allergen_items: e.target.value })} placeholder="Milk, Peanuts, Gluten" style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }} />
                  </label>
                )}
                {editBom && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                    Active
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary">{formLoading ? 'Saving...' : (editBom ? 'Update' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
