import React, { useState } from 'react';
import { POExportData, exportPOExcel } from '../../utils/exportExcel';

// 저장된 발주 데이터 타입
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
    category1: string;  // 대분류
    category2: string;  // 중분류
    category3: string;
    poItemName: string;
    poQty: number;
    unitPrice: number;
    amount: number;
    vcaPrice?: number;
    parPrice?: number;
    specIn?: number;
    netlistIn?: number;
  }[];
}

// 샘플 저장 데이터 (발주 등록 시 누적되는 구조)
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
      { id: 'l-001', stage: 'FAB', category1: 'MPW', category2: 'Cyber shuttle', category3: 'Block portion',
        poItemName: 'MPW Shuttle Run - Block portion', poQty: 1, unitPrice: 45000, amount: 45000,
        vcaPrice: 43000, parPrice: undefined, specIn: undefined, netlistIn: undefined },
      { id: 'l-002', stage: 'FAB', category1: 'MPW', category2: 'Cyber shuttle', category3: 'Extra wafer fee',
        poItemName: 'MPW Extra Wafer', poQty: 3, unitPrice: 7500, amount: 22500,
        vcaPrice: undefined, parPrice: 7200, specIn: undefined, netlistIn: undefined },
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
      { id: 'l-003', stage: 'OSAT_PKG', category1: 'FcCSP', category2: 'Assembly', category3: 'Assy Price',
        poItemName: 'FC-CSP Assembly', poQty: 1600, unitPrice: 2, amount: 3200 },
    ],
  },
];

interface Props {
  orders?: SavedPO[];
  onRowClick?: (order: SavedPO) => void;
}

// Remark 값 결정: TSMC → Rebate Info 요약, 비TSMC → SPEC
function buildRemark(order: SavedPO): string {
  if (order.vendor === 'TSMC') {
    const rebates: string[] = [];
    order.lineItems.forEach(item => {
      if (item.vcaPrice)   rebates.push(`VCA ${item.vcaPrice.toLocaleString()}`);
      if (item.parPrice)   rebates.push(`Par ${item.parPrice.toLocaleString()}`);
      if (item.specIn)     rebates.push(`Spec-in ${item.specIn.toLocaleString()}`);
      if (item.netlistIn)  rebates.push(`Netlist-in ${item.netlistIn.toLocaleString()}`);
    });
    return rebates.length ? rebates.join(' / ') : '-';
  }
  return order.spec || '-';
}

export default function POOrderList({ orders = SAMPLE_ORDERS, onRowClick }: Props) {
  const [filters, setFilters] = useState({ vendor: '', poNo: '', project: '', dateFrom: '', dateTo: '' });

  const filtered = orders.filter(po => {
    if (filters.vendor  && !po.vendor.toLowerCase().includes(filters.vendor.toLowerCase()))   return false;
    if (filters.poNo    && !po.poNo.toLowerCase().includes(filters.poNo.toLowerCase()))       return false;
    if (filters.project && !po.project.toLowerCase().includes(filters.project.toLowerCase())) return false;
    if (filters.dateFrom && po.poDate < filters.dateFrom) return false;
    if (filters.dateTo   && po.poDate > filters.dateTo)   return false;
    return true;
  });

  // 행 단위: 라인 아이템별 flat 전개 (SC-FIN-10 스타일 → 여기선 PO 단위 그룹)
  // 이미지 기준: 한 줄에 PO의 첫 번째 라인 아이템 기준으로 보여주고 다건은 묶어서 표기
  const handleExport = (order: SavedPO) => {
    const exportData: POExportData = { ...order };
    exportPOExcel(exportData);
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        매입 관리 &gt; 매입 발주 &gt; <span>매입 발주 목록</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">매입 발주 목록</h1>
      </div>

      {/* ── Section 1: 필터 ── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px', marginBottom: 12 }}>
          <div>
            <label className="form-label">외주처</label>
            <input type="text" className="form-input" value={filters.vendor}
              placeholder="외주처 검색" onChange={e => setFilters(p => ({ ...p, vendor: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">발주 번호 (PO No.)</label>
            <input type="text" className="form-input" value={filters.poNo}
              placeholder="PO No. 검색" onChange={e => setFilters(p => ({ ...p, poNo: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Project</label>
            <input type="text" className="form-input" value={filters.project}
              placeholder="과제명 검색" onChange={e => setFilters(p => ({ ...p, project: e.target.value }))} />
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

      {/* ── Section 2: 목록 테이블 ── */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                {/* 그룹 헤더 */}
                <th colSpan={3} className="th-group">기본정보</th>
                <th colSpan={2} className="th-group">분류</th>
                <th colSpan={4} className="th-group" style={{ background: '#f0fdf4', color: '#166534' }}>발주 정보</th>
                <th colSpan={3} className="th-group" style={{ background: '#eff6ff', color: '#1d4ed8' }}>원가</th>
                <th rowSpan={2}>Remark
                  <div style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>
                    TSMC: Rebate Info<br/>비TSMC: SPEC
                  </div>
                </th>
                <th rowSpan={2}></th>
              </tr>
              <tr>
                <th>외주처</th>
                <th>Customer</th>
                <th>Project</th>
                <th>대분류</th>
                <th>중분류</th>
                <th style={{ background: '#f0fdf4' }}>PO No.</th>
                <th style={{ background: '#f0fdf4' }}>PO Date</th>
                <th style={{ background: '#f0fdf4' }}>TM Code</th>
                <th style={{ background: '#f0fdf4' }}>QUO No.</th>
                <th style={{ background: '#eff6ff' }}>Qty</th>
                <th style={{ background: '#eff6ff' }}>U/PRC($)</th>
                <th style={{ background: '#eff6ff' }}>Amount($)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ color: '#9ca3af', padding: '48px', textAlign: 'center' }}>
                    조회된 발주가 없습니다.
                  </td>
                </tr>
              )}

              {filtered.map(order => {
                const isTsmc = order.vendor === 'TSMC';
                const remark = buildRemark(order);
                // 첫 번째 라인 아이템 기준으로 대표 행 표시, 다건이면 묶음 표기
                const firstItem = order.lineItems[0];
                const multiItem = order.lineItems.length > 1;

                // 총합계
                const totalQty = order.lineItems.reduce((s, i) => s + i.poQty, 0);

                return (
                  <tr key={order.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onRowClick?.(order)}>
                    <td>
                      <span className={`badge ${isTsmc ? 'badge-blue' : 'badge-orange'}`}>
                        {order.vendor}
                      </span>
                    </td>
                    <td>{order.customer}</td>
                    <td style={{ textAlign: 'left', maxWidth: 120 }}>{order.project}</td>
                    {/* 대분류·중분류: 복수 품목이면 "N건" 표시 */}
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
                    <td style={{ textAlign: 'right', background: '#fafeff' }}>
                      {totalQty.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', background: '#fafeff' }}>
                      {multiItem ? '-' : firstItem.unitPrice.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#1d4ed8', background: '#fafeff' }}>
                      ${order.totalAmount.toLocaleString()}
                    </td>
                    <td style={{ maxWidth: 160, fontSize: 11, color: isTsmc ? '#6d28d9' : '#374151' }}>
                      {remark}
                    </td>
                    {/* Excel 다운로드 */}
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => handleExport(order)}
                        title="Excel 다운로드"
                      >
                        📊
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            총 {filtered.length}건
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['이전', '1', '2', '3', '4', '5', '…', '이후'].map(p => (
              <button key={p} className={`btn btn-ghost btn-sm ${p === '1' ? 'active' : ''}`}
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
