// ---------------------------------------------------------------------------
// Shared game types — used by both server and client
// ---------------------------------------------------------------------------

export * from './cards'

export type PlayerId = string
export type RoomId = string

export interface Player {
  id: PlayerId
  name: string
  /** Seat index: 0 = first to join, 1 = second */
  index: 0 | 1
  /** True once the player has submitted a valid deck */
  deckReady: boolean
}

export interface GameState {
  roomId: RoomId
  status: 'waiting' | 'playing' | 'finished'
  players: Player[]
  /** Index into players[] whose turn it currently is */
  currentPlayerIndex: 0 | 1
  turn: number
  winner: PlayerId | null
  log: string[]
}

// ---------------------------------------------------------------------------
// Wire protocol
// ---------------------------------------------------------------------------

/** Messages sent from the client to the server */
export type ClientMessage =
  | { type: 'create'; name: string }
  | { type: 'join'; name: string; roomId: RoomId }
  | { type: 'select_deck'; deck: import('./cards').PlayerDeck }
  | { type: 'action'; payload: GameAction }

/** A game action — extend `kind` and add typed payloads as the game grows */
export interface GameAction {
  kind: string
  [key: string]: unknown
}

/** Messages sent from the server to the client */
export type ServerMessage =
  | { type: 'joined'; player: Player; roomId: RoomId }
  | { type: 'card_pool'; cards: import('./cards').Card[] }
  | { type: 'state_update'; state: GameState }
  | { type: 'error'; message: string }
  | { type: 'game_over'; winner: Player | null }
