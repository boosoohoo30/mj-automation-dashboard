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
        // Amount 자동계산
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
          {/* 그룹 헤더 */}
          <tr>
            <th colSpan={2} className="th-group">기본정보</th>
            <th colSpan={3} className="th-group">분류</th>
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
            <th rowSpan={2} style={{ background: '#f8f9fb', width: 40 }}></th>
          </tr>
          <tr>
            <th style={{ width: 36 }}>No.</th>
            <th>외주처</th>
            <th>Project</th>
            <th>AL Code</th>
            <th>단계</th>
            {/* 발주 품목명 */}
            <th style={{ background: '#fffde7', minWidth: 160 }}>
              발주 품목명
              <div style={{ fontSize: 10, fontWeight: 400, color: '#d97706' }}>
                (외주처 전달용 - 수정 필수)
              </div>
            </th>
            {/* 발주 원가 */}
            <th style={{ background: '#f0fdf4' }}>PO Qty</th>
            <th style={{ background: '#f0fdf4' }}>U/PRC($)</th>
            <th style={{ background: '#f0fdf4', minWidth: 90 }}>Amount($)</th>
            {/* Rebate Info */}
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
              <td colSpan={isTsmc ? 14 : 10} style={{ color: '#9ca3af', padding: '24px', textAlign: 'center' }}>
                선택된 발주 항목이 없습니다.
              </td>
            </tr>
          )}
          {items.map((item, idx) => (
            <tr key={item.id}>
              <td style={{ color: '#9ca3af', fontSize: 11 }}>{idx + 1}</td>
              <td>
                <span className="badge badge-blue">{item.vendor}</span>
              </td>
              <td style={{ textAlign: 'left', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.project}
              </td>
              <td>{item.alCode || '-'}</td>
              <td>
                <span className={`badge ${item.stage.startsWith('FAB') ? 'badge-blue' : 'badge-orange'}`}>
                  {item.stage}
                </span>
              </td>

              {/* 발주 품목명 - 수정 가능, 외주처 전달용 */}
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
                <input
                  type="number"
                  className="cell-input"
                  style={{ minWidth: 60 }}
                  value={item.poQty}
                  min={0}
                  onChange={e => update(item.id, { poQty: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="cell-input"
                  value={item.unitPrice}
                  min={0}
                  onChange={e => update(item.id, { unitPrice: Number(e.target.value) })}
                />
              </td>
              <td style={{ fontWeight: 600, color: '#1d4ed8' }}>
                {item.amount.toLocaleString()}
              </td>

              {/* Rebate Info (TSMC 전용) */}
              {isTsmc && (
                <>
                  <td>
                    <input
                      type="number"
                      className="cell-input"
                      style={{ minWidth: 70, background: isAdminRebate ? '#fff' : '#f3f4f6' }}
                      value={item.vcaPrice ?? ''}
                      disabled={!isAdminRebate}
                      onChange={e => update(item.id, { vcaPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="cell-input"
                      style={{ minWidth: 70, background: isAdminRebate ? '#fff' : '#f3f4f6' }}
                      value={item.parPrice ?? ''}
                      disabled={!isAdminRebate}
                      onChange={e => update(item.id, { parPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="cell-input"
                      style={{ minWidth: 70, background: isAdminRebate ? '#fff' : '#f3f4f6' }}
                      value={item.specIn ?? ''}
                      disabled={!isAdminRebate}
                      onChange={e => update(item.id, { specIn: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="cell-input"
                      style={{ minWidth: 70, background: isAdminRebate ? '#fff' : '#f3f4f6' }}
                      value={item.netlistIn ?? ''}
                      disabled={!isAdminRebate}
                      onChange={e => update(item.id, { netlistIn: Number(e.target.value) })}
                    />
                  </td>
                </>
              )}

              <td>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444', border: 'none', padding: '4px 8px' }}
                  onClick={() => remove(item.id)}
                  title="행 삭제"
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>

        {/* 합계 행 */}
        {items.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f8f9fb', fontWeight: 600 }}>
              <td colSpan={isTsmc ? 8 : 8} style={{ textAlign: 'right', color: '#374151' }}>
                합계
              </td>
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
