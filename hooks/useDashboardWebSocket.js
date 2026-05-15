'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

const DEFAULT_URL = 'ws://localhost:8080';

export default function useDashboardWebSocket(url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || DEFAULT_URL) {
  const socketRef = useRef(null);
  const lastValidCoordsRef = useRef(null);
  const [connectionState, setConnectionState] = useState(url ? 'connecting' : 'idle');
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [lastMessage, setLastMessage] = useState(null);
  const [serialData, setSerialData] = useState(null);

  useEffect(() => {
    if (!url) {
      socketRef.current = null;
      return undefined;
    }

    const socket = new ReconnectingWebSocket(url, [], {
      WebSocket: window.WebSocket,
      connectionTimeout: 4000,
      maxRetries: 10,
    });

    socketRef.current = socket;

    const handleOpen = () => setConnectionState('open');
    const handleClose = () => setConnectionState('closed');
    const handleError = () => setConnectionState('error');

    const handleMessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setLastMessage(payload);

        if (payload.type === 'users' && typeof payload.data === 'number') {
          setConnectedUsers(payload.data);
        }

        if (payload.type === 'serial' && payload.data?.type === 'data') {
          const d = payload.data;

          // Track last valid GPS so zero coords fall back to it
          if (d.lat !== 0 || d.lon !== 0) {
            lastValidCoordsRef.current = { lat: d.lat, lon: d.lon };
          }
          const coords = lastValidCoordsRef.current;

          setSerialData({
            seq:      d.seq,
            ts:       d.ts,
            gsr:      d.gsr,
            temp:     d.temp,
            skin:     d.skin,
            ir:       d.ir,
            bpm:      d.bpm,
            spo2:     d.spo2,
            spo2Valid: d.spo2_valid === 1,
            noFinger:  d.no_finger === 1,
            lat: coords?.lat ?? 0,
            lon: coords?.lon ?? 0,
            rssi: d.rssi,
            snr:  d.snr,
            receivedAt: payload.receivedAt,
          });
        }
      } catch {
        setLastMessage(event.data);
      }
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('error', handleError);
    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('error', handleError);
      socket.removeEventListener('message', handleMessage);
      socket.close();
      socketRef.current = null;
    };
  }, [url]);

  const sendJson = useCallback((payload) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== window.WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }, []);

  return {
    connectedUsers,
    connectionState: url ? connectionState : 'idle',
    isConnected: url ? connectionState === 'open' : false,
    lastMessage,
    serialData,
    sendJson,
  };
}
