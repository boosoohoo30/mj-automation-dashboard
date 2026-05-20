import React, { useState } from 'react';
import { POWaitingItem, isPoTargetStage } from '../../types/purchase';
import PurchaseOrderRegister from './PurchaseOrderRegister';

// ── 샘플 데이터 (SC-FIN-10 엑셀 기준) ───────────────────────────────
const SAMPLE_ITEMS: POWaitingItem[] = [
  {
    id: 'w-001', salesOrderNo: 'AS-영업1팀-251014-003', rfqNo: 'Q-260423-001',
    am: 'DJ', customer: 'Uniqconn', project: 'UC60Plus_C4', alCode: 'CC65058A',
    pm: 'ES', pmAssigned: true, vendor: 'TSMC', stage: 'FAB',
    category1: 'MPW', category2: 'Cyber shuttle', category3: 'Block portion',
    expectedQty: 1, expectedUnitPrice: 45000, expectedAmount: 45000,
    currentQty: 1, currentUnitPrice: 45000, currentAmount: 45000,
    invoiceTiming: '2606', poStatus: 'pending',
  },
  {
    id: 'w-002', salesOrderNo: 'AS-영업1팀-251014-003', rfqNo: 'Q-260423-001',
    am: 'DJ', customer: 'Uniqconn', project: 'UC60Plus_C4', alCode: 'CC65058A',
    pm: 'ES', pmAssigned: true, vendor: 'TSMC', stage: 'FAB',
    category1: 'MPW', category2: 'Cyber shuttle', category3: 'Extra wafer fee',
    expectedQty: 3, expectedUnitPrice: 7500, expectedAmount: 22500,
    currentQty: 4, currentUnitPrice: 7500, currentAmount: 30000,
    invoiceTiming: '2606', poStatus: 'pending',
  },
  {
    id: 'w-003', salesOrderNo: 'AS-영업2팀-260101', rfqNo: 'Q-260301-001',
    am: 'SY', customer: 'Fadu', project: 'Albatross_N1B', alCode: 'AA12345B',
    pm: 'KS', pmAssigned: true, vendor: 'TSMC', stage: 'FAB',
    category1: 'Single', category2: 'Wafer Buy', category3: 'Pilot Wafer',
    expectedQty: 6, expectedUnitPrice: 400, expectedAmount: 2400,
    currentQty: 6, currentUnitPrice: 400, currentAmount: 2400,
    invoiceTiming: '2701', poStatus: 'pending',
  },
  {
    id: 'w-004', salesOrderNo: 'AS-영업1팀-260407-003', rfqNo: 'Q-260202-001',
    am: 'DJ', customer: 'Uniqconn', project: 'UC60Plus_C4', alCode: 'CC65058A',
    pm: '', pmAssigned: false, vendor: 'ATK4', stage: 'OSAT_PKG',
    category1: 'FcCSP', category2: 'Assembly', category3: 'Assy Price',
    expectedQty: 1600, expectedUnitPrice: 2, expectedAmount: 3200,
    currentQty: 1600, currentUnitPrice: 2, currentAmount: 3200,
    invoiceTiming: '2609', poStatus: 'pending',
  },
];

export default function POWaitingList() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ vendor: '', customer: '', project: '', pm: '' });
  const [showRegister, setShowRegister] = useState(false);

  // 필터만 적용 (탭 없음 - 단계 열에서 FAB/OSAT 구분 가능)
  const filtered = SAMPLE_ITEMS.filter(item => {
    if (!isPoTargetStage(item.stage)) return false;
    if (filters.vendor && item.vendor !== filters.vendor) return false;
    if (filters.customer && !item.customer.toLowerCase().includes(filters.customer.toLowerCase())) return false;
    if (filters.project && !item.project.toLowerCase().includes(filters.project.toLowerCase())) return false;
    if (filters.pm && item.pm !== filters.pm) return false;
    return true;
  });

  const pendingFab  = SAMPLE_ITEMS.filter(i => i.stage.startsWith('FAB')  && i.poStatus === 'pending').length;
  const orderedFab  = SAMPLE_ITEMS.filter(i => i.stage.startsWith('FAB')  && i.poStatus === 'ordered').length;
  const pendingOsat = SAMPLE_ITEMS.filter(i => i.stage.startsWith('OSAT') && i.poStatus === 'pending').length;
  const orderedOsat = SAMPLE_ITEMS.filter(i => i.stage.startsWith('OSAT') && i.poStatus === 'ordered').length;

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  const selectedItems = SAMPLE_ITEMS.filter(i => selectedIds.has(i.id));

  const handleRegisterClick = () => {
    if (selectedItems.length === 0) return;
    setShowRegister(true);
  };

  if (showRegister) {
    return (
      <PurchaseOrderRegister
        selectedItems={selectedItems}
        onCancel={() => setShowRegister(false)}
        onSave={(data) => {
          console.log('저장:', data);
          alert('발주가 저장되었습니다.');
          setShowRegister(false);
          setSelectedIds(new Set());
        }}
      />
    );
  }

  return (
    <div className="page-container">
      <div className="breadcrumb">
        매입 관리 &gt; 매입 발주 &gt; <span>매입 발주 대기 목록</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">매입 발주 대기 목록</h1>
        {/* Section 4: 선택 발주 등록 버튼 */}
        <button
          className="btn btn-primary"
          disabled={selectedIds.size === 0}
          onClick={handleRegisterClick}
        >
          선택 발주 등록 ({selectedIds.size})
        </button>
      </div>

      {/* ── Section 1: 필터 ── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div className="grid-4" style={{ gap: '12px 20px' }}>
          <div>
            <label className="form-label">외주처</label>
            <select
              className="form-select"
              value={filters.vendor}
              onChange={e => setFilters(p => ({ ...p, vendor: e.target.value }))}
            >
              <option value="">전체</option>
              <option>TSMC</option>
              <option>ATK4</option>
              <option>ASE</option>
              <option>DPS</option>
            </select>
          </div>
          <div>
            <label className="form-label">고객사명 (Customer)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                value={filters.customer}
                placeholder="검색"
                onChange={e => setFilters(p => ({ ...p, customer: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="form-label">과제명 (Project)</label>
            <input
              type="text"
              className="form-input"
              value={filters.project}
              placeholder="과제명 또는 품번 검색"
              onChange={e => setFilters(p => ({ ...p, project: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">PM</label>
            <select
              className="form-select"
              value={filters.pm}
              onChange={e => setFilters(p => ({ ...p, pm: e.target.value }))}
            >
              <option value="">전체</option>
              <option value="ES">ES</option>
              <option value="JH">JH</option>
              <option value="KS">KS</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ vendor: '', customer: '', project: '', pm: '' })}
          >
            ↺ 초기화
          </button>
          <button className="btn btn-primary btn-sm">Q 검색</button>
        </div>
      </div>

      {/* ── Section 2: 요약 카드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, marginBottom: 16 }}>
        {/* FAB */}
        <div className="card" style={{ padding: '14px 20px' }}>
          <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 12, fontSize: 13 }}>FAB</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div className="summary-card" style={{ flex: 1, border: '1px solid #dbeafe' }}>
              <div className="label">미발주</div>
              <div className="value" style={{ fontSize: 28, color: '#1d4ed8' }}>{pendingFab}</div>
              <div className="unit">건</div>
            </div>
            <div className="summary-card" style={{ flex: 1, border: '1px solid #dcfce7' }}>
              <div className="label">발주완료</div>
              <div className="value" style={{ fontSize: 28, color: '#15803d' }}>{orderedFab}</div>
              <div className="unit">건</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: '#d1d5db', fontSize: 24 }}>│</div>

        {/* OSAT */}
        <div className="card" style={{ padding: '14px 20px' }}>
          <div style={{ fontWeight: 700, color: '#c2410c', marginBottom: 12, fontSize: 13 }}>OSAT PKG·TEST·ETC</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div className="summary-card" style={{ flex: 1, border: '1px solid #ffedd5' }}>
              <div className="label">미발주</div>
              <div className="value" style={{ fontSize: 28, color: '#c2410c' }}>{pendingOsat}</div>
              <div className="unit">건</div>
            </div>
            <div className="summary-card" style={{ flex: 1, border: '1px solid #dcfce7' }}>
              <div className="label">발주완료</div>
              <div className="value" style={{ fontSize: 28, color: '#15803d' }}>{orderedOsat}</div>
              <div className="unit">건</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: 목록 테이블 ── */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th>매출기안# · AM · Customer</th>
                <th>업체명</th>
                <th>단계</th>
                <th>분류1</th>
                <th>분류2</th>
                <th>분류3</th>
                <th>예정 Qty</th>
                <th>예정 원가($)</th>
                <th>Invoice 시점</th>
                <th>PM</th>
                <th>발주 상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ color: '#9ca3af', padding: '32px', textAlign: 'center' }}>
                    조회된 항목이 없습니다.
                  </td>
                </tr>
              )}
              {filtered.map(item => (
                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => toggleRow(item.id)}>
                  <td onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleRow(item.id)}
                    />
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      {item.salesOrderNo} · {item.am} · {item.customer}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>
                      {item.rfqNo} · {item.project}
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{item.vendor}</span></td>
                  <td>
                    <span className={`badge ${item.stage.startsWith('FAB') ? 'badge-blue' : 'badge-orange'}`}>
                      {item.stage}
                    </span>
                  </td>
                  <td>{item.category1}</td>
                  <td>{item.category2}</td>
                  <td>{item.category3}</td>
                  <td style={{ textAlign: 'right' }}>{item.expectedQty.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ${item.expectedAmount.toLocaleString()}
                  </td>
                  <td>{item.invoiceTiming}</td>
                  <td>
                    {item.pmAssigned
                      ? <span className="badge badge-green">{item.pm}</span>
                      : <span className="badge badge-red">미지정</span>
                    }
                  </td>
                  <td>
                    <span className={`badge ${item.poStatus === 'ordered' ? 'badge-green' : 'badge-gray'}`}>
                      {item.poStatus === 'ordered' ? '발주완료' : '미발주'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'center', gap: 4 }}>
          {['이전', '1', '이후'].map(p => (
            <button key={p} className="btn btn-ghost btn-sm" style={{ minWidth: 32 }}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
