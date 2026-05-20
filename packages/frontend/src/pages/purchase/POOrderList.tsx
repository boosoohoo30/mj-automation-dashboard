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
    // 예정원가
    expectedQty?: number;
    expectedUnitPrice?: number;
    expectedAmountUsd?: number;
    expectedAmountKrw?: number;
    // 현재원가
    currentQty?: number;
    currentUnitPrice?: number;
    currentAmountUsd?: number;
    currentAmountKrw?: number;
    invoiceTiming?: string;
    vcaPrice?: number;
    parPrice?: number;
    specIn?: number;
    netlistIn?: number;
  }[];
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
        expectedQty: 1, expectedUnitPrice: 45000, expectedAmountUsd: 45000, expectedAmountKrw: 65000,
        currentQty: 1, currentUnitPrice: 45000, currentAmountUsd: 45000, currentAmountKrw: 65000,
        invoiceTiming: '2606',
        vcaPrice: 43000,
      },
      {
        id: 'l-002', stage: 'FAB', category1: 'MPW', category2: 'Cyber shuttle', category3: 'Extra wafer fee',
        poItemName: 'MPW Extra Wafer', poQty: 3, unitPrice: 7500, amount: 22500,
        expectedQty: 3, expectedUnitPrice: 7500, expectedAmountUsd: 22500, expectedAmountKrw: 27000,
        currentQty: 4, currentUnitPrice: 7500, currentAmountUsd: 30000, currentAmountKrw: 30000,
        invoiceTiming: '2606',
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
        expectedQty: 1600, expectedUnitPrice: 2, expectedAmountUsd: 3200, expectedAmountKrw: 3200000,
        currentQty: 1600, currentUnitPrice: 2, currentAmountUsd: 3200, currentAmountKrw: 3200000,
        invoiceTiming: '2609',
      },
    ],
  },
];

interface Props {
  orders?: SavedPO[];
  onRowClick?: (order: SavedPO) => void;
}

function buildRemark(order: SavedPO): string {
  if (order.vendor === 'TSMC') {
    const rebates: string[] = [];
    order.lineItems.forEach(item => {
      if (item.vcaPrice)  rebates.push(`VCA ${item.vcaPrice.toLocaleString()}`);
      if (item.parPrice)  rebates.push(`Par ${item.parPrice.toLocaleString()}`);
      if (item.specIn)    rebates.push(`Spec-in ${item.specIn.toLocaleString()}`);
      if (item.netlistIn) rebates.push(`Netlist-in ${item.netlistIn.toLocaleString()}`);
    });
    return rebates.length ? rebates.join(' / ') : '-';
  }
  return order.spec || '-';
}

// 다건 라인 아이템 합계
function sumField(items: SavedPO['lineItems'], field: keyof SavedPO['lineItems'][0]): number {
  return items.reduce((s, i) => s + (Number(i[field]) || 0), 0);
}

export default function POOrderList({ orders = SAMPLE_ORDERS, onRowClick }: Props) {
  const [filters, setFilters] = useState({ vendor: '', poNo: '', project: '', dateFrom: '', dateTo: '' });
  const [showExpected, setShowExpected] = useState(true);
  const [showCurrent, setShowCurrent]   = useState(true);

  const filtered = orders.filter(po => {
    if (filters.vendor  && !po.vendor.toLowerCase().includes(filters.vendor.toLowerCase()))   return false;
    if (filters.poNo    && !po.poNo.toLowerCase().includes(filters.poNo.toLowerCase()))       return false;
    if (filters.project && !po.project.toLowerCase().includes(filters.project.toLowerCase())) return false;
    if (filters.dateFrom && po.poDate < filters.dateFrom) return false;
    if (filters.dateTo   && po.poDate > filters.dateTo)   return false;
    return true;
  });

  const handleExport = (order: SavedPO) => {
    exportPOExcel(order as unknown as POExportData);
  };

  // 고정 컬럼 수 (기본정보+분류+발주정보+원가+Remark+버튼)
  const fixedCols = 14;
  const expectedCols = showExpected ? 3 : 0;
  const currentCols  = showCurrent  ? 4 : 0;
  const totalCols = fixedCols + expectedCols + currentCols;

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

      {/* ── 원가 열 토글 버튼 ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          className="btn btn-sm"
          style={{
            background: showExpected ? '#fef9c3' : '#f3f4f6',
            color: showExpected ? '#854d0e' : '#6b7280',
            border: `1px solid ${showExpected ? '#fde047' : '#e5e7eb'}`,
            fontWeight: showExpected ? 600 : 400,
          }}
          onClick={() => setShowExpected(v => !v)}
        >
          {showExpected ? '▼' : '▶'} 예정원가
          <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>
            (Qty · $ · ₩)
          </span>
        </button>
        <button
          className="btn btn-sm"
          style={{
            background: showCurrent ? '#dcfce7' : '#f3f4f6',
            color: showCurrent ? '#166534' : '#6b7280',
            border: `1px solid ${showCurrent ? '#86efac' : '#e5e7eb'}`,
            fontWeight: showCurrent ? 600 : 400,
          }}
          onClick={() => setShowCurrent(v => !v)}
        >
          {showCurrent ? '▼' : '▶'} 현재원가
          <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>
            (Qty · $ · ₩ · Invoice)
          </span>
        </button>
      </div>

      {/* ── 목록 테이블 ── */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th colSpan={3} className="th-group">기본정보</th>
                <th colSpan={2} className="th-group">분류</th>
                <th colSpan={4} className="th-group" style={{ background: '#f0fdf4', color: '#166534' }}>발주 정보</th>
                <th colSpan={3} className="th-group" style={{ background: '#eff6ff', color: '#1d4ed8' }}>발주 원가</th>
                {showExpected && (
                  <th colSpan={3} className="th-group" style={{ background: '#fefce8', color: '#854d0e' }}>
                    예정원가
                  </th>
                )}
                {showCurrent && (
                  <th colSpan={4} className="th-group" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    현재원가
                  </th>
                )}
                <th rowSpan={2} style={{ minWidth: 100 }}>
                  Remark
                  <div style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>
                    TSMC: Rebate<br />비TSMC: SPEC
                  </div>
                </th>
                <th rowSpan={2} style={{ width: 36 }} />
              </tr>
              <tr>
                <th>외주처</th>
                <th>Customer</th>
                <th>Project</th>
                <th>대분류</th>
                <th>중분류</th>
                <th style={{ background: '#f0fdf4', minWidth: 150 }}>PO No.</th>
                <th style={{ background: '#f0fdf4' }}>PO Date</th>
                <th style={{ background: '#f0fdf4' }}>TM Code</th>
                <th style={{ background: '#f0fdf4' }}>QUO No.</th>
                <th style={{ background: '#eff6ff' }}>Qty</th>
                <th style={{ background: '#eff6ff' }}>U/PRC($)</th>
                <th style={{ background: '#eff6ff' }}>Amount($)</th>
                {showExpected && (
                  <>
                    <th style={{ background: '#fefce8' }}>원가</th>
                    <th style={{ background: '#fefce8' }}>예정원가($)</th>
                    <th style={{ background: '#fefce8' }}>예정원가(₩)</th>
                  </>
                )}
                {showCurrent && (
                  <>
                    <th style={{ background: '#f0fdf4' }}>원가</th>
                    <th style={{ background: '#f0fdf4' }}>현재원가($)</th>
                    <th style={{ background: '#f0fdf4' }}>현재원가(₩)</th>
                    <th style={{ background: '#f0fdf4' }}>Invoice시점</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={totalCols} style={{ color: '#9ca3af', padding: '48px', textAlign: 'center' }}>
                    조회된 발주가 없습니다.
                  </td>
                </tr>
              )}
              {filtered.map(order => {
                const isTsmc = order.vendor === 'TSMC';
                const remark = buildRemark(order);
                const firstItem = order.lineItems[0];
                const multiItem = order.lineItems.length > 1;
                const totalQty = sumField(order.lineItems, 'poQty');
                const totalExpUsd = sumField(order.lineItems, 'expectedAmountUsd');
                const totalExpKrw = sumField(order.lineItems, 'expectedAmountKrw');
                const totalCurUsd = sumField(order.lineItems, 'currentAmountUsd');
                const totalCurKrw = sumField(order.lineItems, 'currentAmountKrw');
                // Invoice 시점: 복수면 첫 항목 표시
                const invoiceTiming = firstItem?.invoiceTiming ?? '-';

                return (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => onRowClick?.(order)}>
                    <td>
                      <span className={`badge ${isTsmc ? 'badge-blue' : 'badge-orange'}`}>
                        {order.vendor}
                      </span>
                    </td>
                    <td>{order.customer}</td>
                    <td style={{ textAlign: 'left', maxWidth: 120 }}>{order.project}</td>
                    <td>
                      {multiItem
                        ? <span style={{ color: '#6b7280', fontSize: 11 }}>{firstItem.category1} 외 {order.lineItems.length - 1}건</span>
                        : firstItem.category1}
                    </td>
                    <td>
                      {multiItem
                        ? <span style={{ color: '#6b7280', fontSize: 11 }}>{firstItem.category2} 외 {order.lineItems.length - 1}건</span>
                        : firstItem.category2}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: '#1d4ed8' }}>
                      {order.poNo}
                    </td>
                    <td>{order.poDate}</td>
                    <td style={{ color: '#6b7280', fontSize: 11 }}>
                      {isTsmc ? (order.tmCode || '-') : '-'}
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 11 }}>{order.quoteNo || '-'}</td>
                    {/* 발주 원가 */}
                    <td style={{ textAlign: 'right', background: '#fafeff' }}>
                      {totalQty.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', background: '#fafeff' }}>
                      {multiItem ? '-' : firstItem.unitPrice.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#1d4ed8', background: '#fafeff' }}>
                      ${order.totalAmount.toLocaleString()}
                    </td>
                    {/* 예정원가 (토글) */}
                    {showExpected && (
                      <>
                        <td style={{ textAlign: 'right', background: '#fffef0' }}>
                          {sumField(order.lineItems, 'expectedQty').toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', background: '#fffef0', fontWeight: 600, color: '#854d0e' }}>
                          ${totalExpUsd.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', background: '#fffef0', color: '#854d0e' }}>
                          ₩{totalExpKrw.toLocaleString()}
                        </td>
                      </>
                    )}
                    {/* 현재원가 (토글) */}
                    {showCurrent && (
                      <>
                        <td style={{ textAlign: 'right', background: '#f9fef9' }}>
                          {sumField(order.lineItems, 'currentQty').toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', background: '#f9fef9', fontWeight: 600, color: '#15803d' }}>
                          ${totalCurUsd.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', background: '#f9fef9', color: '#15803d' }}>
                          ₩{totalCurKrw.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center', background: '#f9fef9', fontSize: 11, color: '#374151' }}>
                          {invoiceTiming}
                        </td>
                      </>
                    )}
                    <td style={{ maxWidth: 140, fontSize: 11, color: isTsmc ? '#6d28d9' : '#374151' }}>
                      {remark}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => handleExport(order)} title="Excel 다운로드">
                        📊
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>총 {filtered.length}건</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['이전', '1', '2', '3', '4', '5', '…', '이후'].map(p => (
              <button key={p} className={`btn btn-ghost btn-sm`}
                style={{ minWidth: 32, ...(p === '1' ? { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' } : {}) }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
