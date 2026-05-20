import React, { useState, useEffect, useCallback } from 'react';
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

const TSMC_TYPES = ['MPW', 'NTO', 'MP', 'RTO', 'IP'] as const;
type TsmcType = typeof TSMC_TYPES[number];

// PO No. 자동 생성 로직
function buildPoNo(vendor: string, tsmcType: TsmcType | '', poDate: string, seq: string): string {
  const datePart = poDate ? poDate.replace(/-/g, '') : 'YYYYMMDD';
  const seqPart  = seq.padStart(2, '0');
  if (vendor === 'TSMC') {
    const type = tsmcType || 'MPW';
    return `AL-${type}-${datePart}-${seqPart}`;
  }
  // 비TSMC: 외주처명 그대로 사용
  const vendorPart = vendor || 'VENDOR';
  return `AL-${vendorPart}-${datePart}-${seqPart}`;
}

// 내보내기 필드 구성 정의
const EXPORT_FIELDS = {
  po_info: [
    { key: 'poNo',       label: 'PO No.',        includePdf: true,  includeXls: true,  note: '' },
    { key: 'poDate',     label: 'PO Date',        includePdf: true,  includeXls: true,  note: '' },
    { key: 'vendor',     label: '외주처',          includePdf: true,  includeXls: true,  note: '' },
    { key: 'poCurrency', label: 'PO 금액 단위',    includePdf: true,  includeXls: true,  note: '' },
    { key: 'tmCode',     label: 'TM Code',        includePdf: true,  includeXls: true,  note: 'TSMC 전용' },
    { key: 'quoteNo',    label: '견적서 No.',      includePdf: true,  includeXls: true,  note: '' },
    { key: 'salesOrderNo', label: '매출기안#',    includePdf: false, includeXls: true,  note: '내부 관리용' },
    { key: 'rfqNo',      label: 'RFQ#',           includePdf: false, includeXls: true,  note: '내부 관리용' },
    { key: 'customer',   label: 'Customer',       includePdf: false, includeXls: true,  note: '외주처 미노출 (거래처 기밀)' },
    { key: 'project',    label: 'Project',        includePdf: false, includeXls: true,  note: '외주처 미노출' },
    { key: 'alCode',     label: 'AL Code',        includePdf: false, includeXls: true,  note: '내부 관리용' },
  ],
  line_items: [
    { key: 'poItemName', label: '발주 품목명',    includePdf: true,  includeXls: true,  note: '외주처 전달용 편집명' },
    { key: 'poQty',      label: 'PO Qty',        includePdf: true,  includeXls: true,  note: '' },
    { key: 'unitPrice',  label: 'U/PRC($)',       includePdf: true,  includeXls: true,  note: '' },
    { key: 'amount',     label: 'Amount($)',      includePdf: true,  includeXls: true,  note: '자동계산' },
    { key: 'stage',      label: '단계',           includePdf: false, includeXls: true,  note: '내부 분류' },
    { key: 'category1',  label: '분류1',          includePdf: false, includeXls: true,  note: '내부 분류' },
    { key: 'category2',  label: '분류2',          includePdf: false, includeXls: true,  note: '내부 분류' },
    { key: 'category3',  label: '분류3',          includePdf: false, includeXls: true,  note: '내부 분류' },
    { key: 'vcaPrice',   label: 'VCA Price',      includePdf: true,  includeXls: true,  note: 'TSMC·관리자 전용' },
    { key: 'parPrice',   label: 'Par price',      includePdf: true,  includeXls: true,  note: 'TSMC·관리자 전용' },
    { key: 'specIn',     label: 'Spec-in',        includePdf: true,  includeXls: true,  note: 'TSMC·관리자 전용' },
    { key: 'netlistIn',  label: 'Netlist-in',     includePdf: true,  includeXls: true,  note: 'TSMC·관리자 전용' },
  ],
};

export default function PurchaseOrderRegister({ selectedItems, onCancel, onSave }: Props) {
  const [vendor, setVendor]             = useState('');
  const [customer, setCustomer]         = useState('');
  const [project, setProject]           = useState('');
  const [alCode, setAlCode]             = useState('');
  const [salesOrderNo, setSalesOrderNo] = useState('');
  const [rfqNo, setRfqNo]               = useState('');

  const [tsmcType, setTsmcType]   = useState<TsmcType | ''>('MPW');
  const [poSeq, setPoSeq]         = useState('01');
  const [poNo, setPoNo]           = useState('');
  const [poDate, setPoDate]       = useState('');
  const [quoteNo, setQuoteNo]     = useState('');
  const [poCurrency, setPoCurrency] = useState<'USD' | 'KRW'>('USD');
  const [tmCode, setTmCode]       = useState('');
  // TSMC 전용
  const [processName, setProcessName] = useState('');
  // 비TSMC 전용
  const [spec, setSpec]           = useState('');

  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [isAdminRebate, setIsAdminRebate]     = useState(false);
  const [showRebateModal, setShowRebateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (selectedItems.length === 0) return;
    const rep = selectedItems[0];
    setVendor(rep.vendor);
    setCustomer(rep.customer);
    setProject(rep.project);
    setAlCode(rep.alCode);
    setSalesOrderNo(rep.salesOrderNo);
    setRfqNo(rep.rfqNo);
    if (rep.vendor === 'TSMC') {
      setTsmcType('MPW');
      setProcessName(rep.rfqDescription ?? '');
    }
    setLineItems(selectedItems.map(toLineItem));
  }, []);

  // PO No. 자동 갱신
  const refreshPoNo = useCallback(() => {
    setPoNo(buildPoNo(vendor, tsmcType, poDate, poSeq));
  }, [vendor, tsmcType, poDate, poSeq]);

  useEffect(() => { refreshPoNo(); }, [refreshPoNo]);

  const isTsmc = vendor === 'TSMC';
  const totalAmount = lineItems.reduce((s, i) => s + i.amount, 0);

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      id: nextId(), sourceId: '', vendor, project, alCode,
      stage: '', category1: '', category2: '', category3: '',
      poItemName: '', poQty: 0, unitPrice: 0, amount: 0,
    }]);
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
        {/* 내보내기 버튼 그룹 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowExportModal(true)}>
            📋 내보내기 항목 구성
          </button>
          <button className="btn btn-secondary" disabled={!canSave}>
            📊 Excel 다운로드
          </button>
          <button className="btn btn-secondary" disabled={!canSave}>
            📄 PDF 발주서
          </button>
        </div>
      </div>

      <div className="warning-box" style={{ marginBottom: 16 }}>
        <span>⚠️</span>
        <div>
          <strong>발주 품목명 수정 필수</strong> —
          외주처 전달 PO에는 내부 분류 코드가 노출되지 않습니다.
          <span style={{ background: '#fef3c7', padding: '0 4px', borderRadius: 3, margin: '0 4px' }}>황색 셀</span>에
          외주처에 전달할 실제 품목명을 입력해 주세요.
        </div>
      </div>

      {/* ─── Section 1: PO 정보 ─── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-header">
          <div className="section-number">1</div>
          <div className="section-title">PO 정보</div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* ── 내부 참조 정보 (읽기전용) ── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px 24px',
            padding: '10px 14px', background: '#f8f9fb', borderRadius: 6,
            marginBottom: 16, border: '1px solid #f0f0f0',
          }}>
            {[
              { label: '매출기안#', value: salesOrderNo },
              { label: 'RFQ#',     value: rfqNo },
              { label: 'Customer', value: customer },
              { label: 'AL Code',  value: alCode },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ color: '#9ca3af' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{value || '-'}</span>
              </div>
            ))}
          </div>

          {/* ── 외주처 선택 (공통 최상단) ── */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">외주처 <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <select className="form-select" style={{ maxWidth: 220 }} value={vendor}
                onChange={e => setVendor(e.target.value)}>
                <option value="">선택</option>
                {VENDOR_LIST.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {vendor && (
                <span className={`badge ${isTsmc ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 12 }}>
                  {isTsmc ? 'TSMC 발주 · Rebate Info 등록 가능' : `${vendor} 발주`}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>CUST-05 등록 외주처</div>
          </div>

          <hr className="divider" style={{ marginBottom: 16 }} />

          {/* ── TSMC 전용 PO 정보 필드 ── */}
          {isTsmc && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 24px' }}>
              {/* 1. PO No. (TSMC 자동생성) */}
              <div>
                <label className="form-label">
                  PO No. <span style={{ marginLeft: 4, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>자동 생성</span>
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select className="form-select" style={{ width: 86, flexShrink: 0 }}
                    value={tsmcType} onChange={e => setTsmcType(e.target.value as TsmcType)}>
                    {TSMC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" className="form-input" style={{ width: 52, flexShrink: 0, textAlign: 'center' }}
                    min={1} max={99} value={Number(poSeq)}
                    onChange={e => setPoSeq(String(e.target.value).padStart(2, '0'))} />
                  <input type="text" className="form-input"
                    style={{ background: '#f5f3ff', color: '#6d28d9', fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}
                    value={poNo} readOnly />
                </div>
                <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 4 }}>
                  AL-<b>TYPE</b>-YYYYMMDD-NN　·　type: MPW · NTO · MP · RTO · IP
                </div>
              </div>

              {/* 2. PO Date */}
              <div>
                <label className="form-label">PO Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" className="form-input" value={poDate} onChange={e => setPoDate(e.target.value)} />
              </div>

              {/* 3. 견적서 No. */}
              <div>
                <label className="form-label">견적서 No.</label>
                <input type="text" className="form-input" value={quoteNo} placeholder="견적서 번호 입력"
                  onChange={e => setQuoteNo(e.target.value)} />
              </div>

              {/* 4. 공정명 */}
              <div>
                <label className="form-label">공정명</label>
                <input type="text" className="form-input" value={processName}
                  placeholder="예) 65nm CMOS MSRF GP+ 12inch"
                  onChange={e => setProcessName(e.target.value)} />
              </div>

              {/* 5. TM Code */}
              <div>
                <label className="form-label">TM Code</label>
                <input type="text" className="form-input" value={tmCode}
                  placeholder="TM Code 입력" onChange={e => setTmCode(e.target.value)} />
              </div>

              {/* 6. 과제명 (Project - 자동 반입) */}
              <div>
                <label className="form-label">과제명</label>
                <input type="text" className="form-input" value={project} readOnly
                  style={{ background: '#f3f4f6', color: '#6b7280' }} />
              </div>

              {/* 7. PO 금액 단위 */}
              <div>
                <label className="form-label">PO 금액 단위</label>
                <select className="form-select" value={poCurrency}
                  onChange={e => setPoCurrency(e.target.value as 'USD' | 'KRW')}>
                  <option value="USD">달러 (USD $)</option>
                  <option value="KRW">원화 (KRW ₩)</option>
                </select>
              </div>
            </div>
          )}

          {/* ── 비TSMC PO 정보 필드 ── */}
          {!isTsmc && vendor && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 24px' }}>
              {/* 1. PO No. */}
              <div>
                <label className="form-label">PO No.</label>
                <input type="text" className="form-input"
                  style={{ fontFamily: 'monospace', color: '#1d4ed8', fontWeight: 600 }}
                  value={poNo} readOnly />
                <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4 }}>
                  AL-<b>{vendor}</b>-YYYYMMDD-NN
                </div>
              </div>

              {/* 2. PO Date */}
              <div>
                <label className="form-label">PO Date <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" className="form-input" value={poDate} onChange={e => setPoDate(e.target.value)} />
              </div>

              {/* 3. 견적서 No. */}
              <div>
                <label className="form-label">견적서 No.</label>
                <input type="text" className="form-input" value={quoteNo} placeholder="견적서 번호 입력"
                  onChange={e => setQuoteNo(e.target.value)} />
              </div>

              {/* 4. 과제명 */}
              <div>
                <label className="form-label">과제명</label>
                <input type="text" className="form-input" value={project} readOnly
                  style={{ background: '#f3f4f6', color: '#6b7280' }} />
              </div>

              {/* 5. SPEC */}
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">SPEC</label>
                <textarea className="form-textarea" rows={2} value={spec}
                  placeholder="사양, 특이사항, 조건 등 자유롭게 기재"
                  style={{ resize: 'vertical' }}
                  onChange={e => setSpec(e.target.value)} />
              </div>

              {/* 6. PO 금액 단위 */}
              <div>
                <label className="form-label">PO 금액 단위</label>
                <select className="form-select" value={poCurrency}
                  onChange={e => setPoCurrency(e.target.value as 'USD' | 'KRW')}>
                  <option value="USD">달러 (USD $)</option>
                  <option value="KRW">원화 (KRW ₩)</option>
                </select>
              </div>
            </div>
          )}

          {/* 외주처 미선택 안내 */}
          {!vendor && (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              외주처를 선택하면 PO 정보 입력 항목이 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* ─── Section 2: 발주 품목 ─── */}
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

      {/* ─── Rebate Info 수정 모달 ─── */}
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

      {/* ─── 내보내기 항목 구성 모달 ─── */}
      {showExportModal && (
        <ExportPreviewModal onClose={() => setShowExportModal(false)} isTsmc={isTsmc} />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   내보내기 항목 구성 미리보기 모달
──────────────────────────────────────────────────────────── */
function ExportPreviewModal({ onClose, isTsmc }: { onClose: () => void; isTsmc: boolean }) {
  const cellStyle = (inPdf: boolean, inXls: boolean): React.CSSProperties => ({
    padding: '6px 10px',
    fontSize: 12,
    textAlign: 'center',
    background: inPdf ? '#dcfce7' : '#f3f4f6',
    color: inPdf ? '#166534' : '#9ca3af',
    borderRadius: 4,
    fontWeight: inPdf ? 600 : 400,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700, width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📋 내보내기 항목 구성</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              Excel(내부용)과 PDF 발주서(외주처 전달용)에 포함되는 항목을 구분합니다.
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* 범례 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 14, height: 14, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 3, display: 'inline-block' }} />
              포함
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 14, height: 14, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 3, display: 'inline-block' }} />
              미포함
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280' }}>
              * 외주처에 전달되는 PDF 발주서 기준으로 구분
            </div>
          </div>

          {/* PO 헤더 정보 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#111827' }}>
              PO 헤더 정보
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px', background: '#f8f9fb', borderBottom: '1px solid #e5e7eb', width: '30%' }}>항목</th>
                  <th style={{ textAlign: 'center', padding: '6px 10px', background: '#f8f9fb', borderBottom: '1px solid #e5e7eb', width: '15%' }}>
                    <span style={{ color: '#15803d' }}>📄 PDF 발주서</span>
                  </th>
                  <th style={{ textAlign: 'center', padding: '6px 10px', background: '#f8f9fb', borderBottom: '1px solid #e5e7eb', width: '15%' }}>
                    <span style={{ color: '#1d4ed8' }}>📊 Excel</span>
                  </th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', background: '#f8f9fb', borderBottom: '1px solid #e5e7eb' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {EXPORT_FIELDS.po_info.map(f => (
                  <tr key={f.key} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '6px 10px', fontWeight: f.includePdf ? 500 : 400, color: f.includePdf ? '#111827' : '#9ca3af' }}>{f.label}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <span style={cellStyle(f.includePdf, f.includeXls)}>
                        {f.includePdf ? '✓ 포함' : '✕'}
                      </span>
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <span style={{ ...cellStyle(f.includeXls, f.includeXls), background: f.includeXls ? '#dbeafe' : '#f3f4f6', color: f.includeXls ? '#1d4ed8' : '#9ca3af' }}>
                        {f.includeXls ? '✓ 포함' : '✕'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 10px', color: '#6b7280', fontSize: 11 }}>{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 발주 품목 */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#111827' }}>
              발주 품목 (라인별)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px', background: '#f8f9fb', borderBottom: '1px solid #e5e7eb', width: '30%' }}>항목</th>
                  <th style={{ textAlign: 'center', padding: '6px 10px', background: '#f8f9fb', borderBottom: '1px solid #e5e7eb', width: '15%' }}>
                    <span style={{ color: '#15803d' }}>📄 PDF 발주서</span>
                  </th>
                  <th style={{ textAlign: 'center', padding: '6px 10px', background: '#f8f9fb', borderBottom: '1px solid #e5e7eb', width: '15%' }}>
                    <span style={{ color: '#1d4ed8' }}>📊 Excel</span>
                  </th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', background: '#f8f9fb', borderBottom: '1px solid #e5e7eb' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {EXPORT_FIELDS.line_items
                  .filter(f => isTsmc || !['vcaPrice','parPrice','specIn','netlistIn'].includes(f.key))
                  .map(f => (
                    <tr key={f.key} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '6px 10px', fontWeight: f.includePdf ? 500 : 400, color: f.includePdf ? '#111827' : '#9ca3af' }}>{f.label}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <span style={cellStyle(f.includePdf, f.includeXls)}>
                          {f.includePdf ? '✓ 포함' : '✕'}
                        </span>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <span style={{ ...cellStyle(f.includeXls, f.includeXls), background: f.includeXls ? '#dbeafe' : '#f3f4f6', color: f.includeXls ? '#1d4ed8' : '#9ca3af' }}>
                          {f.includeXls ? '✓ 포함' : '✕'}
                        </span>
                      </td>
                      <td style={{ padding: '6px 10px', color: '#6b7280', fontSize: 11 }}>{f.note}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="info-box" style={{ marginTop: 16 }}>
            <span>💡</span>
            <div style={{ fontSize: 11 }}>
              <strong>PDF 발주서</strong>는 외주처 전달용입니다. 내부 분류코드(단계·분류1/2/3)·Customer·AL Code는 미포함됩니다.<br />
              <strong>Excel</strong>은 내부 관리용으로 모든 항목이 포함되며, 시트 1(PO 헤더) + 시트 2(발주 품목 상세)로 구성됩니다.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
