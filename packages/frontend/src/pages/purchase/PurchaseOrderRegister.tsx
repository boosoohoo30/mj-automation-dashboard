import React, { useState, useEffect } from 'react';
import POItemsTable from '../../components/purchase/POItemsTable';
import {
  POLineItem,
  POWaitingItem,
  VENDOR_LIST,
  buildDefaultPoItemName,
} from '../../types/purchase';

interface Props {
  selectedItems: POWaitingItem[];
  onCancel: () => void;
  onSave: (data: Record<string, unknown>) => void;
}

let lineIdCounter = 1;
const nextId = () => `line-${lineIdCounter++}`;

function toLineItem(item: POWaitingItem): POLineItem {
  return {
    id: nextId(),
    sourceId: item.id,
    vendor: item.vendor,
    project: item.project,
    alCode: item.alCode,
    stage: item.stage,
    category1: item.category1,
    category2: item.category2,
    category3: item.category3,
    poItemName: buildDefaultPoItemName(item.category1, item.category2, item.category3),
    poQty: item.expectedQty,
    unitPrice: item.expectedUnitPrice,
    amount: item.expectedQty * item.expectedUnitPrice,
    vcaPrice: undefined,
    parPrice: undefined,
    specIn: undefined,
    netlistIn: undefined,
  };
}

export default function PurchaseOrderRegister({ selectedItems, onCancel, onSave }: Props) {
  // PO 정보 - 기본값은 선택 항목에서 자동 추출
  const [vendor, setVendor]           = useState('');
  const [customer, setCustomer]       = useState('');
  const [project, setProject]         = useState('');
  const [alCode, setAlCode]           = useState('');
  const [salesOrderNo, setSalesOrderNo] = useState('');
  const [rfqNo, setRfqNo]             = useState('');
  const [poNo, setPoNo]               = useState('');
  const [poDate, setPoDate]           = useState('');
  const [quoteNo, setQuoteNo]         = useState('');
  const [poCurrency, setPoCurrency]   = useState<'USD' | 'KRW'>('USD');
  const [tmCode, setTmCode]           = useState('');

  // 발주 품목
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);

  const [isAdminRebate, setIsAdminRebate]   = useState(false);
  const [showRebateModal, setShowRebateModal] = useState(false);

  // 선택 항목 → PO 정보 자동 채우기 + 라인 아이템 변환
  useEffect(() => {
    if (selectedItems.length === 0) return;
    const rep = selectedItems[0];
    setVendor(rep.vendor);
    setCustomer(rep.customer);
    setProject(rep.project);
    setAlCode(rep.alCode);
    setSalesOrderNo(rep.salesOrderNo);
    setRfqNo(rep.rfqNo);
    setLineItems(selectedItems.map(toLineItem));
  }, []);

  const isTsmc = vendor === 'TSMC';
  const totalAmount = lineItems.reduce((s, i) => s + i.amount, 0);

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: nextId(), sourceId: '',
        vendor, project, alCode,
        stage: '', category1: '', category2: '', category3: '',
        poItemName: '', poQty: 0, unitPrice: 0, amount: 0,
      },
    ]);
  };

  const unfilledNames = lineItems.filter(i => !i.poItemName.trim());
  const canSave = vendor && poDate && lineItems.length > 0 && unfilledNames.length === 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ vendor, customer, project, alCode, salesOrderNo, rfqNo, poNo, poDate, quoteNo, poCurrency, tmCode, lineItems, totalAmount });
  };

  return (
    <div className="page-container">
      <div className="breadcrumb">
        매입 관리 &gt; 매입 발주 &gt; <span>매입 발주 등록</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">매입 발주 등록</h1>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            구매 발주 대기 목록에서 선택된 {selectedItems.length}건의 항목을 발주 등록합니다.
          </div>
        </div>
      </div>

      {/* 발주품목명 수정 안내 */}
      <div className="warning-box" style={{ marginBottom: 16 }}>
        <span>⚠️</span>
        <div>
          <strong>발주 품목명 수정 필수</strong> —
          외주처 전달 PO에는 내부 분류 코드가 노출되지 않습니다.
          아래 표에서 <span style={{ background: '#fef3c7', padding: '0 4px', borderRadius: 3 }}>황색 셀</span>에
          외주처에 전달할 실제 품목명을 입력해 주세요.
        </div>
      </div>

      {/* ─────────────── Section 1: PO 정보 ─────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <div className="section-number">1</div>
          <div className="section-title">PO 정보</div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Row 1: 기안 참조 정보 (읽기전용) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
            <div>
              <label className="form-label">매출기안#</label>
              <input type="text" className="form-input" value={salesOrderNo} readOnly
                style={{ background: '#f3f4f6', color: '#6b7280' }} />
            </div>
            <div>
              <label className="form-label">RFQ#</label>
              <input type="text" className="form-input" value={rfqNo} readOnly
                style={{ background: '#f3f4f6', color: '#6b7280' }} />
            </div>
            <div>
              <label className="form-label">AL Code</label>
              <input type="text" className="form-input" value={alCode} readOnly
                style={{ background: '#f3f4f6', color: '#6b7280' }} />
            </div>
            <div>
              <label className="form-label">Customer</label>
              <input type="text" className="form-input" value={customer} readOnly
                style={{ background: '#f3f4f6', color: '#6b7280' }} />
            </div>
            <div>
              <label className="form-label">Project</label>
              <input type="text" className="form-input" value={project} readOnly
                style={{ background: '#f3f4f6', color: '#6b7280' }} />
            </div>
          </div>

          <hr className="divider" style={{ marginBottom: 16 }} />

          {/* Row 2: PO 작성 정보 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px' }}>
            <div>
              <label className="form-label">
                외주처 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select className="form-select" value={vendor} onChange={e => setVendor(e.target.value)}>
                <option value="">선택</option>
                {VENDOR_LIST.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                CUST-05 등록 외주처 · 선택 시 PO No./Date 자동 기입
              </div>
            </div>
            <div>
              <label className="form-label">PO No.</label>
              <input type="text" className="form-input" value={poNo} placeholder="PO 번호 자동 기입"
                onChange={e => setPoNo(e.target.value)} />
            </div>
            <div>
              <label className="form-label">
                PO Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="date" className="form-input" value={poDate} onChange={e => setPoDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">견적서 No.</label>
              <input type="text" className="form-input" value={quoteNo} placeholder="견적서 번호 입력"
                onChange={e => setQuoteNo(e.target.value)} />
            </div>
            <div>
              <label className="form-label">PO 금액 단위</label>
              <select className="form-select" value={poCurrency} onChange={e => setPoCurrency(e.target.value as 'USD' | 'KRW')}>
                <option value="USD">달러 (USD $)</option>
                <option value="KRW">원화 (KRW ₩)</option>
              </select>
            </div>
            <div>
              <label className="form-label">
                TM Code
                {!isTsmc && <span style={{ marginLeft: 6, color: '#9ca3af', fontWeight: 400 }}>(TSMC 전용)</span>}
              </label>
              <input type="text" className="form-input" value={tmCode}
                placeholder={isTsmc ? 'TM Code 입력' : '-'} disabled={!isTsmc}
                onChange={e => setTmCode(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────── Section 2: 발주 품목 ─────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <div className="section-number">2</div>
          <div className="section-title">발주 품목</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {isTsmc && (
              <button className="btn btn-ghost btn-sm" style={{ color: '#6b21a8', borderColor: '#d8b4fe' }}
                onClick={() => setShowRebateModal(true)}>
                Rebate Info 항목수정
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={addLineItem}>+ 품목 추가</button>
          </div>
        </div>

        {unfilledNames.length > 0 && lineItems.length > 0 && (
          <div style={{ padding: '8px 20px 0' }}>
            <div className="warning-box" style={{ fontSize: 11 }}>
              <span>⚠️</span>
              <span><strong>발주 품목명 미입력 {unfilledNames.length}건</strong> — 저장 전 황색 셀을 모두 입력해 주세요.</span>
            </div>
          </div>
        )}

        <div style={{ padding: '12px 0 0' }}>
          <POItemsTable items={lineItems} isTsmc={isTsmc} isAdminRebate={isAdminRebate} onChange={setLineItems} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid #f0f0f0', gap: 24, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>발주 품목 {lineItems.length}건</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 13, color: '#374151' }}>총 발주 금액</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1d4ed8' }}>
              {poCurrency === 'USD' ? '$' : '₩'}{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 32 }}>
        <button className="btn btn-secondary" onClick={onCancel}>취소</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={handleSave}>저장</button>
      </div>

      {/* Rebate Info 수정 모달 */}
      {showRebateModal && (
        <div className="modal-overlay" onClick={() => setShowRebateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: 15 }}>Rebate Info 항목수정</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRebateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box" style={{ marginBottom: 16 }}>
                <span>ℹ️</span>
                <span>관리자 권한이 있는 경우에만 VCA Price / Par price / Spec-in / Netlist-in 수정이 가능합니다.</span>
              </div>
              <div>
                <label className="form-label">관리자 비밀번호</label>
                <input type="password" className="form-input" placeholder="비밀번호 입력" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRebateModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={() => { setIsAdminRebate(true); setShowRebateModal(false); }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
