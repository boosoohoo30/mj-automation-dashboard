// 매입매출 등록조회(SC-FIN-10) 기반 데이터 구조
export interface SalesItem {
  id: string;
  salesOrderNo: string;   // 매출기안#
  rfqNo: string;          // RFQ#
  rfqDescription: string; // 공정명 (예: 65nm CMOS MSRF GP+ 12inch)
  am: string;
  customer: string;
  project: string;
  alCode: string;
  pm: string;
  pmAssigned: boolean;
  vendor: string;         // 업체명/외주처
  stage: string;          // 단계 (FAB / OSAT_PKG / OSAT_TEST 등)
  category1: string;      // 분류1 (MPW / Single / OSAT 등)
  category2: string;      // 분류2
  category3: string;      // 분류3
  expectedQty: number;
  expectedUnitPrice: number;
  expectedAmount: number;
  currentQty: number;
  currentUnitPrice: number;
  currentAmount: number;
  invoiceTiming: string;
}

// 구매발주 대기목록 항목
export interface POWaitingItem extends SalesItem {
  poStatus: 'pending' | 'ordered';
  selected?: boolean;
}

// 발주 품목 행 (매입 발주 등록 테이블)
export interface POLineItem {
  id: string;
  sourceId: string;       // SalesItem.id 참조
  vendor: string;
  project: string;
  alCode: string;
  stage: string;
  category1: string;      // 중분류
  category2: string;      // 분류2
  category3: string;      // 분류3 (내부 기준)
  poItemName: string;     // 발주 품목명 (외주처 전달용 - 직접 수정 가능)
  poQty: number;
  unitPrice: number;
  amount: number;         // poQty × unitPrice 자동계산
  // Rebate Info (TSMC 전용)
  vcaPrice?: number;
  parPrice?: number;
  specIn?: number;
  netlistIn?: number;
  rebateType?: 'VCA Price' | 'Par price' | 'Spec-in' | 'Netlist-in';
}

// 매입 발주 등록 폼 (PUR-02)
export interface PurchaseOrderForm {
  id?: string;
  vendor: string;           // 외주처 (CUST-05 등록)
  poNo: string;
  poDate: string;
  quoteNo: string;          // 견적서 No.
  poCurrency: 'USD' | 'KRW'; // PO 금액 단위
  tmCode: string;           // TM Code (TSMC 전용)
  lineItems: POLineItem[];
  totalAmount: number;
  status: 'draft' | 'saved' | 'sent';
}

// 외주처(벤더) 목록
export const VENDOR_LIST = ['TSMC', 'DPS', 'ANDES', 'ATK4', 'ASE', 'DI'] as const;
export type VendorName = typeof VENDOR_LIST[number];

// FAB / OSAT 단계 구분 (구매발주 대상)
export const FAB_STAGES = ['FAB'] as const;
export const OSAT_STAGES = ['OSAT_PKG', 'OSAT_TEST', 'OSAT_ETC'] as const;
export const PO_TARGET_STAGES = [...FAB_STAGES, ...OSAT_STAGES];

export const isPoTargetStage = (stage: string) =>
  PO_TARGET_STAGES.some(s => stage.startsWith(s));

// 내부 분류 → 발주 품목명 기본 매핑 (수정 가능)
export const DEFAULT_PO_ITEM_NAME_MAP: Record<string, string> = {
  'MPW/Cyber shuttle/Block portion': 'MPW Shuttle Run - Block portion',
  'MPW/Cyber shuttle/Extra wafer fee': 'MPW Extra Wafer',
  'Single/Wafer Buy/Pilot Wafer': 'Wafer Purchase - Pilot Wafer',
  'OSAT_PKG/FcCSP/Assembly/Assy Price': 'FC-CSP Assembly',
};

export const buildDefaultPoItemName = (cat1: string, cat2: string, cat3: string): string => {
  const key = [cat1, cat2, cat3].filter(Boolean).join('/');
  return DEFAULT_PO_ITEM_NAME_MAP[key] ?? [cat2, cat3].filter(Boolean).join(' / ');
};
