import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { baseURL, type ScoreSession } from '@/lib/api';

export function useSessionLiveSync(sessionId: string, session: ScoreSession | null, refreshSession: (id: string) => Promise<void>) {
  const [liveConnected, setLiveConnected] = useState(false);

  useEffect(() => {
    if (!sessionId || session?.id !== sessionId || session.status === 'finished') return;
    let stopped = false;
    let foreground = AppState.currentState === 'active';
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1000;
    const connect = () => {
      if (stopped || !foreground) return;
      const connectedSocket = new WebSocket(`${baseURL.replace(/^http/, 'ws')}/ws`);
      socket = connectedSocket;
      connectedSocket.onopen = () => {
        if (stopped || !foreground || socket !== connectedSocket) { connectedSocket.close(); return; }
        retryDelay = 1000;
        setLiveConnected(true);
        connectedSocket.send(JSON.stringify({ type: 'room.join', payload: { room: `session:${sessionId}` } }));
        refreshSession(sessionId).catch(() => undefined);
      };
      connectedSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as { type?: string; payload?: { queryKey?: string[] } };
          if (message.type === 'query.invalidate' && message.payload?.queryKey?.[0] === 'sessions' && message.payload.queryKey[1] === sessionId) refreshSession(sessionId).catch(() => undefined);
        } catch { /* Ignore messages outside the session contract. */ }
      };
      connectedSocket.onerror = () => { if (socket === connectedSocket) setLiveConnected(false); };
      connectedSocket.onclose = () => {
        if (socket !== connectedSocket) return;
        setLiveConnected(false);
        if (!stopped && foreground) {
          retryTimer = setTimeout(connect, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 15000);
        }
      };
    };
    connect();
    const appState = AppState.addEventListener('change', (state) => {
      foreground = state === 'active';
      if (foreground) {
        refreshSession(sessionId).catch(() => undefined);
        if (retryTimer) clearTimeout(retryTimer);
        if (!socket || socket.readyState >= WebSocket.CLOSING) connect();
      } else {
        if (retryTimer) clearTimeout(retryTimer);
        socket?.close();
      }
    });
    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      appState.remove();
      socket?.close();
    };
  }, [sessionId, session?.id, session?.status, refreshSession]);

  useEffect(() => {
    if (!sessionId || session?.id !== sessionId || session.status === 'finished') return;
    const timer = setInterval(() => refreshSession(sessionId).catch(() => undefined), liveConnected ? 20000 : 5000);
    return () => clearInterval(timer);
  }, [sessionId, session?.id, session?.status, liveConnected, refreshSession]);

  return { liveConnected };
}
