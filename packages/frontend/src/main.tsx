import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import POWaitingList from './pages/purchase/POWaitingList';
import POOrderList, { SavedPO } from './pages/purchase/POOrderList';

type Page = 'waiting' | 'list';

function App() {
  const [page, setPage] = useState<Page>('waiting');
  const [savedOrders, setSavedOrders] = useState<SavedPO[]>([]);

  const handleSave = (data: Record<string, unknown>) => {
    const newOrder: SavedPO = {
      id: `po-${Date.now()}`,
      vendor:       data.vendor as string,
      customer:     data.customer as string,
      project:      data.project as string,
      alCode:       data.alCode as string,
      tmCode:       data.tmCode as string | undefined,
      processName:  data.processName as string | undefined,
      spec:         data.spec as string | undefined,
      poNo:         data.poNo as string,
      poDate:       data.poDate as string,
      quoteNo:      data.quoteNo as string,
      poCurrency:   data.poCurrency as 'USD' | 'KRW',
      salesOrderNo: data.salesOrderNo as string,
      rfqNo:        data.rfqNo as string,
      totalAmount:  data.totalAmount as number,
      lineItems:    (data.lineItems as SavedPO['lineItems']),
    };
    setSavedOrders(prev => [newOrder, ...prev]);
    setPage('list');
  };

  return (
    <>
      {/* 상단 탭 네비게이션 */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 24px', display: 'flex', gap: 0,
      }}>
        <button
          className={`tab-btn ${page === 'waiting' ? 'active' : ''}`}
          onClick={() => setPage('waiting')}
        >
          구매발주 대기목록
        </button>
        <button
          className={`tab-btn ${page === 'list' ? 'active' : ''}`}
          onClick={() => setPage('list')}
        >
          매입 발주 목록
          {savedOrders.length > 0 && (
            <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px' }}>
              {savedOrders.length}
            </span>
          )}
        </button>
      </div>

      {page === 'waiting' && (
        <POWaitingList onSave={handleSave} />
      )}
      {page === 'list' && (
        <POOrderList orders={savedOrders.length > 0 ? savedOrders : undefined} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
