import React, { useState } from 'react';
import { POExportData, exportPOExcel } from '../../utils/exportExcel';

export interface SavedPO {
  id: string;
  vendor: string;
  customer: string;
  project: string;
  tmCode?: string;
  processName?: string;
  spec?: string;
  poNo: string;
  poDate: string;
  quoteNo: string;
  poCurrency: 'USD' | 'KRW';
  salesOrderNo: string;
  rfqNo: string;
  alCode: string;
  totalAmount: number;
  lineItems: {
    id: string;
    stage: string;
    category1: string;
    category2: string;
    category3: string;
    poItemName: string;
    poQty: number;
    unitPrice: number;
    amount: number;
    remark?: string;
    vcaPrice?: number;
    parPrice?: number;
    specIn?: number;
    netlistIn?: number;
  }[];
}

// 라인 아이템 Remark: TSMC → rebate 요약, 비TSMC → remark 필드
function lineRemark(item: SavedPO['lineItems'][0], isTsmc: boolean): string {
  const parts: string[] = [];
  if (isTsmc) {
    if (item.vcaPrice)  parts.push(`VCA $${item.vcaPrice.toLocaleString()}`);
    if (item.parPrice)  parts.push(`Par $${item.parPrice.toLocaleString()}`);
    if (item.specIn)    parts.push(`Spec-in $${item.specIn.toLocaleString()}`);
    if (item.netlistIn) parts.push(`Netlist-in $${item.netlistIn.toLocaleString()}`);
  }
  if (item.remark) parts.push(item.remark);
  return parts.join(' / ');
}

const SAMPLE_ORDERS: SavedPO[] = [
  {
    id: 'po-001',
    vendor: 'TSMC', customer: 'Uniqconn', project: 'UC60Plus_C4',
    tmCode: 'TM-2606-001', processName: '65nm CMOS MSRF GP+ 12inch',
    poNo: 'AL-MPW-20260520-01', poDate: '2026-05-20',
    quoteNo: 'QUO-2026-001', poCurrency: 'USD',
    salesOrderNo: 'AS-영업1팀-251014-003', rfqNo: 'RFQ-260423-001', alCode: 'CC65058A',
    totalAmount: 67500,
    lineItems: [
      {
        id: 'l-001', stage: 'FAB', category1: 'MPW', category2: 'Cyber shuttle', category3: 'Block portion',
        poItemName: 'MPW Shuttle Run - Block portion', poQty: 1, unitPrice: 45000, amount: 45000,
        vcaPrice: 43000,
      },
      {
        id: 'l-002', stage: 'FAB', category1: 'MPW', category2: 'Cyber shuttle', category3: 'Extra wafer fee',
        poItemName: 'MPW Extra Wafer', poQty: 3, unitPrice: 7500, amount: 22500,
        parPrice: 7200,
      },
    ],
  },
  {
    id: 'po-002',
    vendor: 'ATK4', customer: 'Uniqconn', project: 'UC60Plus_C4',
    spec: 'FcCSP 패키지, 리드프리, MSL 3',
    poNo: 'AL-ATK4-20260521-01', poDate: '2026-05-21',
    quoteNo: 'QUO-2026-002', poCurrency: 'USD',
    salesOrderNo: 'AS-영업1팀-260407-003', rfqNo: 'RFQ-260202-001', alCode: 'CC65058A',
    totalAmount: 3200,
    lineItems: [
      {
        id: 'l-003', stage: 'OSAT_PKG', category1: 'FcCSP', category2: 'Assembly', category3: 'Assy Price',
        poItemName: 'FC-CSP Assembly', poQty: 1600, unitPrice: 2, amount: 3200,
      },
    ],
  },
];

interface Props {
  orders?: SavedPO[];
  onRowClick?: (order: SavedPO) => void;
}

// 총 컬럼 수: 단계(1) + 분류3(3) + 발주품목명(1) + Qty(1) + U/PRC(1) + Amount(1) + Remark(1) + 액션(1) = 10
const TOTAL_COLS = 10;

export default function POOrderList({ orders = SAMPLE_ORDERS, onRowClick }: Props) {
  const [filters, setFilters] = useState({ vendor: '', poNo: '', project: '', dateFrom: '', dateTo: '' });

  const filtered = orders.filter(po => {
    if (filters.vendor   && !po.vendor.toLowerCase().includes(filters.vendor.toLowerCase()))   return false;
    if (filters.poNo     && !po.poNo.toLowerCase().includes(filters.poNo.toLowerCase()))       return false;
    if (filters.project  && !po.project.toLowerCase().includes(filters.project.toLowerCase())) return false;
    if (filters.dateFrom && po.poDate < filters.dateFrom) return false;
    if (filters.dateTo   && po.poDate > filters.dateTo)   return false;
    return true;
  });

  const handleExport = (e: React.MouseEvent, order: SavedPO) => {
    e.stopPropagation();
    exportPOExcel(order as unknown as POExportData);
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        매입 관리 &gt; 매입 발주 &gt; <span>매입 발주 목록</span>
      </div>
      <div className="page-header">
        <h1 className="page-title">매입 발주 목록</h1>
      </div>

      {/* ── 필터 ── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px', marginBottom: 12 }}>
          <div>
            <label className="form-label">외주처</label>
            <input type="text" className="form-input" value={filters.vendor} placeholder="외주처 검색"
              onChange={e => setFilters(p => ({ ...p, vendor: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">발주 번호 (PO No.)</label>
            <input type="text" className="form-input" value={filters.poNo} placeholder="PO No. 검색"
              onChange={e => setFilters(p => ({ ...p, poNo: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Project</label>
            <input type="text" className="form-input" value={filters.project} placeholder="과제명 검색"
              onChange={e => setFilters(p => ({ ...p, project: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">발주 기간 (PO Date)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" className="form-input" value={filters.dateFrom}
                onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} />
              <span style={{ color: '#9ca3af', flexShrink: 0 }}>~</span>
              <input type="date" className="form-input" value={filters.dateTo}
                onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
            <button className="btn btn-ghost btn-sm"
              onClick={() => setFilters({ vendor: '', poNo: '', project: '', dateFrom: '', dateTo: '' })}>
              ↺ 초기화
            </button>
            <button className="btn btn-primary btn-sm">Q 검색</button>
          </div>
        </div>
      </div>

      {/* ── 목록 테이블 ── */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th colSpan={4} className="th-group">분류</th>
                <th className="th-group" style={{ background: '#fffbeb', color: '#92400e' }}>발주품목명</th>
                <th colSpan={3} className="th-group" style={{ background: '#eff6ff', color: '#1d4ed8' }}>발주 원가</th>
                <th rowSpan={2} style={{ minWidth: 110 }}>
                  Remark
                  <div style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>TSMC: Rebate / 비TSMC: 비고</div>
                </th>
                <th rowSpan={2} style={{ width: 40 }} />
              </tr>
              <tr>
                <th>단계</th>
                <th>분류1</th>
                <th>분류2</th>
                <th>분류3</th>
                <th style={{ background: '#fffde7', minWidth: 160, textAlign: 'left' }}>발주품목명</th>
                <th style={{ background: '#eff6ff' }}>Qty</th>
                <th style={{ background: '#eff6ff' }}>U/PRC($)</th>
                <th style={{ background: '#eff6ff', minWidth: 90 }}>Amount($)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={TOTAL_COLS} style={{ color: '#9ca3af', padding: '48px', textAlign: 'center' }}>
                    조회된 발주가 없습니다.
                  </td>
                </tr>
              )}
              {filtered.map(order => {
                const isTsmc = order.vendor === 'TSMC';
                const totalAmt = order.lineItems.reduce((s, i) => s + i.amount, 0);

                return (
                  <React.Fragment key={order.id}>
                    {/* ── PO 그룹 헤더 행 ── */}
                    <tr
                      style={{ background: isTsmc ? '#f0f4ff' : '#fdf6f0', cursor: onRowClick ? 'pointer' : 'default' }}
                      onClick={() => onRowClick?.(order)}
                    >
                      <td colSpan={TOTAL_COLS} style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          {/* 외주처 + PO No. */}
                          <span className={`badge ${isTsmc ? 'badge-blue' : 'badge-orange'}`}>
                            {order.vendor}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#1d4ed8' }}>
                            {order.poNo}
                          </span>
                          <span style={{ color: '#6b7280', fontSize: 12 }}>{order.poDate}</span>

                          {/* 구분선 */}
                          <span style={{ color: '#d1d5db' }}>|</span>

                          {/* 고객사 / 과제 */}
                          <span style={{ fontSize: 12, color: '#374151' }}>{order.customer}</span>
                          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{order.project}</span>

                          {order.quoteNo && (
                            <>
                              <span style={{ color: '#d1d5db' }}>|</span>
                              <span style={{ fontSize: 11, color: '#6b7280' }}>QUO: {order.quoteNo}</span>
                            </>
                          )}

                          {/* TSMC 전용 정보 */}
                          {isTsmc && (
                            <>
                              <span style={{ color: '#d1d5db' }}>|</span>
                              {order.tmCode && (
                                <span style={{
                                  background: '#f5f3ff', color: '#6d28d9',
                                  padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                                }}>
                                  TM: {order.tmCode}
                                </span>
                              )}
                              {order.processName && (
                                <span style={{
                                  background: '#eff6ff', color: '#1d4ed8',
                                  padding: '1px 8px', borderRadius: 4, fontSize: 11,
                                }}>
                                  {order.processName}
                                </span>
                              )}
                            </>
                          )}

                          {/* 비TSMC SPEC */}
                          {!isTsmc && order.spec && (
                            <>
                              <span style={{ color: '#d1d5db' }}>|</span>
                              <span style={{ fontSize: 11, color: '#6b7280' }}>SPEC: {order.spec}</span>
                            </>
                          )}

                          {/* 📊 버튼 */}
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px' }}
                            onClick={e => handleExport(e, order)}
                            title="Excel 다운로드"
                          >
                            📊 Excel
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── 라인 아이템 행 ── */}
                    {order.lineItems.map(item => {
                      const remark = lineRemark(item, isTsmc);
                      return (
                        <tr key={item.id} style={{ background: '#fff' }}>
                          <td>
                            <span className={`badge ${item.stage.startsWith('FAB') ? 'badge-blue' : 'badge-orange'}`}>
                              {item.stage}
                            </span>
                          </td>
                          <td>{item.category1}</td>
                          <td style={{ color: '#6b7280', fontSize: 12 }}>{item.category2}</td>
                          <td style={{ color: '#6b7280', fontSize: 12 }}>{item.category3}</td>
                          <td style={{ textAlign: 'left', maxWidth: 200, fontSize: 12 }}>{item.poItemName}</td>
                          <td style={{ textAlign: 'right' }}>{item.poQty.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: '#6b7280' }}>{item.unitPrice.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#1d4ed8', background: '#fafeff' }}>
                            ${item.amount.toLocaleString()}
                          </td>
                          <td style={{ fontSize: 11, color: isTsmc ? '#6d28d9' : '#374151' }}>
                            {remark || '-'}
                          </td>
                          <td />
                        </tr>
                      );
                    })}

                    {/* ── 합계 행 ── */}
                    <tr style={{ background: '#f8f9fb', fontWeight: 700, borderTop: '1px solid #e5e7eb' }}>
                      <td colSpan={7} style={{ textAlign: 'right', color: '#374151', fontSize: 12, paddingRight: 12 }}>
                        합계 ({order.lineItems.length}건)
                      </td>
                      <td style={{ textAlign: 'right', color: '#1d4ed8', fontSize: 14, background: '#fafeff' }}>
                        ${totalAmt.toLocaleString()}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '10px 20px' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>총 {filtered.length}건</span>
        </div>
      </div>
    </div>
  );
}
