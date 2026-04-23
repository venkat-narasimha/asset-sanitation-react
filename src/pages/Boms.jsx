import { useState, useEffect } from 'react'
import { getErpBoms, getBomItems, getBomWorkOrders } from '../api/sanitation.js'
import styles from './Boms.module.css'

export default function Boms() {
  const [boms, setBoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedBom, setSelectedBom] = useState(null)
  const [bomItems, setBomItems] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    getErpBoms({ limit: 100 })
      .then(r => setBoms(r.data || []))
      .catch(() => setBoms([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedBom) return
    setDetailLoading(true)
    Promise.all([
      getBomItems(selectedBom.name),
      getBomWorkOrders(selectedBom.name),
    ]).then(([itemsRes, wosRes]) => {
      setBomItems(itemsRes.data || [])
      setWorkOrders(wosRes.data || [])
    }).catch(() => {
      setBomItems([])
      setWorkOrders([])
    }).finally(() => setDetailLoading(false))
  }, [selectedBom])

  const filtered = boms.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return b.name?.toLowerCase().includes(q) ||
      b.item?.toLowerCase().includes(q)
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bills of Materials</h1>
        <span className={styles.badge}>ERPNext</span>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by BOM name or item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading from ERPNext...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No BOMs found</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>BOM Name</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Is Active</th>
                <th>Allergen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr
                  key={b.name}
                  className={styles.clickRow}
                  onClick={() => setSelectedBom(b)}
                >
                  <td className={styles.mono}>{b.name}</td>
                  <td>{b.item || '—'}</td>
                  <td>{b.quantity ?? '—'}</td>
                  <td>
                    {b.is_active ? (
                      <span className={styles.yes}>Yes</span>
                    ) : (
                      <span className={styles.no}>No</span>
                    )}
                  </td>
                  <td>
                    {b.is_allergen || b.custom_is_allergen ? (
                      <span className={styles.allergen}>⚠️ Yes</span>
                    ) : (
                      <span className={styles.noAllergen}>No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedBom && (
        <BomDetailModal
          bom={selectedBom}
          items={bomItems}
          workOrders={workOrders}
          loading={detailLoading}
          onClose={() => { setSelectedBom(null); setBomItems([]); setWorkOrders([]) }}
        />
      )}
    </div>
  )
}

function BomDetailModal({ bom, items, workOrders, loading, onClose }) {
  const allergenItems = items.filter(i => i.custom_is_allergen)

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{bom.name}</h2>
            <p className={styles.modalSub}>{bom.item || '—'} · Qty: {bom.quantity} · {bom.is_active ? '✅ Active' : '❌ Inactive'}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading BOM data...</div>
        ) : (
          <>
            {allergenItems.length > 0 && (
              <div className={styles.allergenBanner}>
                ⚠️ Contains {allergenItems.length} allergen item{allergenItems.length > 1 ? 's' : ''}
              </div>
            )}

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>BOM Items ({items.length})</h3>
              {items.length === 0 ? (
                <p className={styles.empty}>No items</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>UOM</th>
                      <th>Allergen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr
                        key={item.name}
                        className={item.custom_is_allergen ? styles.allergenRow : ''}
                      >
                        <td className={styles.mono}>{item.item_code || '—'}</td>
                        <td>{item.item_name || item.item_code || '—'}</td>
                        <td>{item.qty}</td>
                        <td>{item.uom || '—'}</td>
                        <td>
                          {item.custom_is_allergen ? (
                            <span className={styles.allergenBadge}>
                              ⚠️ {item.allergen_names || 'Allergen'}
                            </span>
                          ) : (
                            <span className={styles.safe}>✅</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Work Orders ({workOrders.length})</h3>
              {workOrders.length === 0 ? (
                <p className={styles.empty}>No work orders reference this BOM</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>WO Name</th>
                      <th>Status</th>
                      <th>Production Item</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map(wo => (
                      <tr key={wo.name}>
                        <td className={styles.mono}>{wo.name}</td>
                        <td><span className={`${styles.statusBadge} ${styles[wo.status?.toLowerCase().replace(' ', '-')] || ''}`}>{wo.status || '—'}</span></td>
                        <td>{wo.production_item || '—'}</td>
                        <td>{wo.qty ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}