import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import POWaitingList from './pages/purchase/POWaitingList';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <POWaitingList />
  </React.StrictMode>
);
