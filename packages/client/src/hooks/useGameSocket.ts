/// <reference types="vite/client" />
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, GameAction, GameState, Player, ServerMessage } from 'shared';

const WS_URL = import.meta.env.DEV ? 'ws://localhost:3001' : `ws://${window.location.host}`;

interface SocketState {
  connected: boolean;
  player: Player | null;
  gameState: GameState | null;
  error: string | null;
}

const INITIAL: SocketState = {
  connected: false,
  player: null,
  gameState: null,
  error: null,
};

/**
 * Manages the WebSocket lifecycle for a single player session.
 * Connects when `playerName` is provided, cleans up on unmount.
 */
export function useGameSocket(playerName: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<SocketState>(INITIAL);

  useEffect(() => {
    if (!playerName) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true }));
      const msg: ClientMessage = { type: 'join', name: playerName };
      ws.send(JSON.stringify(msg));
    };

    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data as string) as ServerMessage;

      switch (msg.type) {
        case 'joined':
          setState((s) => ({ ...s, player: msg.player }));
          break;
        case 'state_update':
          setState((s) => ({ ...s, gameState: msg.state, error: null }));
          break;
        case 'error':
          setState((s) => ({ ...s, error: msg.message }));
          break;
        case 'game_over':
          // handled via state_update; extend here if needed
          break;
      }
    };

    ws.onclose = () => setState((s) => ({ ...s, connected: false }));
    ws.onerror = () => setState((s) => ({ ...s, error: 'Connection error.' }));

    return () => ws.close();
  }, [playerName]);

  const sendAction = useCallback((action: GameAction) => {
    const msg: ClientMessage = { type: 'action', payload: action };
    wsRef.current?.send(JSON.stringify(msg));
  }, []);

  return { ...state, sendAction };
}
