import * as XLSX from 'xlsx';

export interface POExportData {
  // 헤더 정보
  poNo: string;
  poDate: string;
  vendor: string;
  poCurrency: 'USD' | 'KRW';
  tmCode?: string;
  processName?: string;
  spec?: string;
  quoteNo: string;
  salesOrderNo: string;
  rfqNo: string;
  customer: string;
  project: string;
  alCode: string;
  totalAmount: number;
  // 라인 아이템
  lineItems: {
    stage: string;
    category1: string;
    category2: string;
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

const currSymbol = (cur: string) => cur === 'USD' ? '$' : '₩';

export function exportPOExcel(data: POExportData) {
  const wb = XLSX.utils.book_new();
  const isTsmc = data.vendor === 'TSMC';
  const sym = currSymbol(data.poCurrency);

  /* ── Sheet 1: PO 헤더 정보 ── */
  const headerRows: (string | number)[][] = [
    ['매입 발주 등록서'],
    [],
    ['[PO 기본 정보]'],
    ['PO No.',       data.poNo],
    ['PO Date',      data.poDate],
    ['외주처',        data.vendor],
    ['PO 금액 단위',  data.poCurrency],
    ['견적서 No.',    data.quoteNo || '-'],
  ];

  if (isTsmc) {
    headerRows.push(['공정명', data.processName || '-']);
    headerRows.push(['TM Code', data.tmCode || '-']);
  } else {
    headerRows.push(['SPEC', data.spec || '-']);
  }

  headerRows.push(
    ['과제명 (Project)', data.project],
    [],
    ['[내부 참조 정보]'],
    ['매출기안#',   data.salesOrderNo],
    ['RFQ#',       data.rfqNo],
    ['Customer',   data.customer],
    ['AL Code',    data.alCode],
    [],
    ['총 발주 금액', `${sym}${data.totalAmount.toLocaleString()}`],
  );

  const ws1 = XLSX.utils.aoa_to_sheet(headerRows);
  ws1['!cols'] = [{ wch: 20 }, { wch: 40 }];
  // 타이틀 굵게
  if (ws1['A1']) ws1['A1'].s = { font: { bold: true, sz: 14 } };
  XLSX.utils.book_append_sheet(wb, ws1, 'PO 헤더');

  /* ── Sheet 2: 발주 품목 상세 ── */
  const itemHeader = ['No.', '단계', '대분류', '중분류', '분류3', '발주 품목명', 'PO Qty', `U/PRC(${sym})`, `Amount(${sym})`];
  if (isTsmc) itemHeader.push('VCA Price', 'Par price', 'Spec-in', 'Netlist-in');
  itemHeader.push('비고(내부용)');

  const itemRows = data.lineItems.map((item, i) => {
    const row: (string | number)[] = [
      i + 1,
      item.stage,
      item.category1,
      item.category2,
      item.category3,
      item.poItemName,
      item.poQty,
      item.unitPrice,
      item.amount,
    ];
    if (isTsmc) {
      row.push(item.vcaPrice ?? '', item.parPrice ?? '', item.specIn ?? '', item.netlistIn ?? '');
    }
    row.push(''); // 비고
    return row;
  });

  // 합계 행
  const totalRow: (string | number)[] = ['', '', '', '', '', '합계', '', '', data.totalAmount];
  if (isTsmc) totalRow.push('', '', '', '');
  totalRow.push('');

  const ws2 = XLSX.utils.aoa_to_sheet([itemHeader, ...itemRows, [], totalRow]);
  ws2['!cols'] = [
    { wch: 5 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 16 },
    { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
    ...(isTsmc ? [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }] : []),
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '발주 품목');

  /* ── Sheet 3: PDF용 발주서 (외주처 전달용) ── */
  const pdfHeader = ['No.', '발주 품목명', 'PO Qty', `U/PRC(${sym})`, `Amount(${sym})`];
  if (isTsmc) pdfHeader.push('VCA Price', 'Par price', 'Spec-in', 'Netlist-in');

  const pdfMeta: (string | number)[][] = [
    ['발주서 (Purchase Order)'],
    [],
    ['PO No.',    data.poNo,    '',  'PO Date',  data.poDate],
    ['외주처',    data.vendor,  '',  '금액단위',  data.poCurrency],
    ['견적서 No.', data.quoteNo || '-', '', isTsmc ? 'TM Code' : 'SPEC', isTsmc ? (data.tmCode || '-') : (data.spec || '-')],
    isTsmc ? ['공정명', data.processName || '-'] : [],
    ['과제명',    data.project],
    [],
    pdfHeader,
    ...data.lineItems.map((item, i) => {
      const row: (string | number)[] = [i + 1, item.poItemName, item.poQty, item.unitPrice, item.amount];
      if (isTsmc) row.push(item.vcaPrice ?? '', item.parPrice ?? '', item.specIn ?? '', item.netlistIn ?? '');
      return row;
    }),
    [],
    ['', '합계', '', '', data.totalAmount],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(pdfMeta);
  ws3['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
    ...(isTsmc ? [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }] : [])];
  XLSX.utils.book_append_sheet(wb, ws3, '발주서(외주처용)');

  XLSX.writeFile(wb, `PO_${data.poNo || 'draft'}_${data.poDate || 'date'}.xlsx`);
}
