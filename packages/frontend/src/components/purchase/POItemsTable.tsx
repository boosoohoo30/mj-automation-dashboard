import React from 'react';
import { POLineItem } from '../../types/purchase';

interface Props {
  items: POLineItem[];
  isTsmc: boolean;
  isAdminRebate: boolean;
  onChange: (items: POLineItem[]) => void;
}

export default function POItemsTable({ items, isTsmc, isAdminRebate, onChange }: Props) {
  const update = (id: string, patch: Partial<POLineItem>) => {
    onChange(
      items.map(item => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        next.amount = Number(next.poQty) * Number(next.unitPrice);
        return next;
      })
    );
  };

  const remove = (id: string) => onChange(items.filter(i => i.id !== id));

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th colSpan={4} className="th-group">분류</th>
            <th colSpan={1} className="th-group" style={{ background: '#fffbeb', color: '#92400e' }}>
              발주 품목명
            </th>
            <th colSpan={3} className="th-group" style={{ background: '#f0fdf4', color: '#166534' }}>
              발주 원가
            </th>
            {isTsmc && (
              <th colSpan={4} className="th-group" style={{ background: '#faf5ff', color: '#6b21a8' }}>
                Rebate Info
              </th>
            )}
            <th rowSpan={2} style={{ background: '#f8f9fb', width: 40 }} />
          </tr>
          <tr>
            <th style={{ width: 80 }}>단계</th>
            <th>분류1</th>
            <th>분류2</th>
            <th>분류3</th>
            <th style={{ background: '#fffde7', minWidth: 160 }}>
              발주 품목명
              <div style={{ fontSize: 10, fontWeight: 400, color: '#d97706' }}>(외주처 전달용 · 수정 필수)</div>
            </th>
            <th style={{ background: '#f0fdf4' }}>PO Qty</th>
            <th style={{ background: '#f0fdf4' }}>U/PRC($)</th>
            <th style={{ background: '#f0fdf4', minWidth: 90 }}>Amount($)</th>
            {isTsmc && (
              <>
                <th style={{ background: '#faf5ff' }}>VCA Price</th>
                <th style={{ background: '#faf5ff' }}>Par price</th>
                <th style={{ background: '#faf5ff' }}>Spec-in</th>
                <th style={{ background: '#faf5ff' }}>Netlist-in</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={isTsmc ? 13 : 9} style={{ color: '#9ca3af', padding: '24px', textAlign: 'center' }}>
                선택된 발주 항목이 없습니다.
              </td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <span className={`badge ${item.stage.startsWith('FAB') ? 'badge-blue' : 'badge-orange'}`}>
                  {item.stage}
                </span>
              </td>
              <td>{item.category1}</td>
              <td>{item.category2}</td>
              <td>{item.category3}</td>

              {/* 발주 품목명 - 수정 가능 */}
              <td className="po-name-cell">
                <input
                  type="text"
                  className="cell-input-text"
                  value={item.poItemName}
                  placeholder="외주처에 전달할 품목명 입력"
                  onChange={e => update(item.id, { poItemName: e.target.value })}
                />
                <div className="po-name-hint">
                  내부: {[item.category1, item.category2, item.category3].filter(Boolean).join(' / ')}
                </div>
              </td>

              {/* 발주 원가 */}
              <td>
                <input type="number" className="cell-input" style={{ minWidth: 60 }}
                  value={item.poQty} min={0}
                  onChange={e => update(item.id, { poQty: Number(e.target.value) })} />
              </td>
              <td>
                <input type="number" className="cell-input" value={item.unitPrice} min={0}
                  onChange={e => update(item.id, { unitPrice: Number(e.target.value) })} />
              </td>
              <td style={{ fontWeight: 600, color: '#1d4ed8' }}>
                {item.amount.toLocaleString()}
              </td>

              {/* Rebate Info (TSMC 전용) */}
              {isTsmc && (
                <>
                  {(['vcaPrice', 'parPrice', 'specIn', 'netlistIn'] as const).map(field => (
                    <td key={field}>
                      <input type="number" className="cell-input"
                        style={{ minWidth: 70, background: isAdminRebate ? '#fff' : '#f3f4f6' }}
                        value={item[field] ?? ''}
                        disabled={!isAdminRebate}
                        onChange={e => update(item.id, { [field]: Number(e.target.value) })} />
                    </td>
                  ))}
                </>
              )}

              <td>
                <button className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444', border: 'none', padding: '4px 8px' }}
                  onClick={() => remove(item.id)} title="행 삭제">🗑</button>
              </td>
            </tr>
          ))}
        </tbody>

        {items.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f8f9fb', fontWeight: 600 }}>
              <td colSpan={7} style={{ textAlign: 'right', color: '#374151' }}>합계</td>
              <td style={{ color: '#1d4ed8', fontWeight: 700 }}>
                ${items.reduce((s, i) => s + i.amount, 0).toLocaleString()}
              </td>
              {isTsmc && <td colSpan={4} />}
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
