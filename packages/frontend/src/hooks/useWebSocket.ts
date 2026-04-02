import { useEffect, useRef, useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handleWsEvent = useWorkflowStore((s) => s.handleWsEvent);

  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 3s
      setTimeout(() => {
        wsRef.current = null;
      }, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type && msg.type !== 'connected') {
          handleWsEvent(msg.type, msg.data);
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
    };
  }, [handleWsEvent]);

  return { connected };
}
