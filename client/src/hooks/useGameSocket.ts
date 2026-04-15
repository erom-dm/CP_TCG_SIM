/// <reference types="vite/client" />
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClientMessage, GameAction, GameState, Player, PlayerDeck, RoomId, ServerMessage } from 'shared'
// PlayerDeck is used in the Session type below

const WS_URL = import.meta.env.DEV ? 'ws://localhost:3001' : `ws://${window.location.host}`

export type Session =
  | { mode: 'create'; name: string; deck: PlayerDeck }
  | { mode: 'join'; name: string; roomId: RoomId; deck: PlayerDeck }

interface SocketState {
  connected: boolean
  player: Player | null
  gameState: GameState | null
  error: string | null
}

const INITIAL: SocketState = {
  connected: false,
  player: null,
  gameState: null,
  error: null,
}

/**
 * Manages the WebSocket lifecycle for a single player session.
 * Connects when `session` is non-null, cleans up on unmount or session change.
 */
export function useGameSocket(session: Session | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const [state, setState] = useState<SocketState>(INITIAL)

  useEffect(() => {
    if (!session) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true }))

      const msg: ClientMessage =
        session.mode === 'create'
          ? { type: 'create', name: session.name }
          : { type: 'join', name: session.name, roomId: session.roomId }

      ws.send(JSON.stringify(msg))
    }

    ws.onmessage = ({ data }) => {
      const msg = JSON.parse(data as string) as ServerMessage

      switch (msg.type) {
        case 'joined':
          setState((s) => ({ ...s, player: msg.player, error: null }))
          ws.send(JSON.stringify({ type: 'select_deck', deck: session.deck } satisfies ClientMessage))
          break
        case 'state_update':
          setState((s) => ({ ...s, gameState: msg.state, error: null }))
          break
        case 'error':
          setState((s) => ({ ...s, error: msg.message }))
          break
        case 'game_over':
          // handled via state_update; extend here if needed
          break
      }
    }

    ws.onclose = () => setState((s) => ({ ...s, connected: false }))
    ws.onerror = () => setState((s) => ({ ...s, error: 'Connection error.' }))

    return () => {
      ws.close()
      setState(INITIAL)
    }
  }, [session])

  const sendAction = useCallback((action: GameAction) => {
    const msg: ClientMessage = { type: 'action', payload: action }
    wsRef.current?.send(JSON.stringify(msg))
  }, [])

  return { ...state, sendAction }
}
