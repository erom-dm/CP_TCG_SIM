import { WebSocket } from 'ws'
import { randomUUID } from 'crypto'
import type { Deck, GameState, GameAction, Player, PlayerDeck, ServerMessage } from 'shared'
import { validatePlayerDeck, resolveDeck } from './cards/registry.js'

export class GameRoom {
  readonly id: string
  private state: GameState
  /** Maps player ID → their WebSocket */
  private sockets = new Map<string, WebSocket>()
  /** Maps player ID → their resolved deck (set after a valid select_deck message) */
  private decks = new Map<string, Deck>()

  constructor() {
    this.id = randomUUID()
    this.state = {
      roomId: this.id,
      status: 'waiting',
      players: [],
      currentPlayerIndex: 0,
      turn: 1,
      winner: null,
      log: [],
    }
  }

  isFull(): boolean {
    return this.state.players.length >= 2
  }

  isEmpty(): boolean {
    return this.sockets.size === 0
  }

  /**
   * Register a new player in this room.
   * Returns the created Player so the caller can send a 'joined' ack.
   */
  addPlayer(socket: WebSocket, name: string): Player {
    const player: Player = {
      id: randomUUID(),
      name,
      index: this.state.players.length as 0 | 1,
      deckReady: false,
    }

    this.state.players.push(player)
    this.sockets.set(player.id, socket)

    if (this.state.players.length === 2) {
      this.state.status = 'playing'
      this.log('Game started! Good luck.')
    }

    return player
  }

  removePlayer(playerId: string): void {
    this.sockets.delete(playerId)
    this.state.players = this.state.players.filter((p) => p.id !== playerId)

    if (this.state.status === 'playing') {
      this.state.status = 'waiting'
      this.log('A player disconnected. Waiting for reconnection...')
    }
  }

  selectDeck(playerId: string, playerDeck: PlayerDeck): void {
    validatePlayerDeck(playerDeck)
      .then((errors) => {
        if (errors.length > 0) {
          this.sendTo(playerId, { type: 'error', message: errors[0].message })
          return
        }
        return resolveDeck(playerDeck).then((deck) => {
          this.decks.set(playerId, deck)
          const player = this.state.players.find((p) => p.id === playerId)
          if (player) player.deckReady = true
          this.broadcastState()
        })
      })
      .catch((err) => {
        console.error('selectDeck error:', err)
        this.sendTo(playerId, { type: 'error', message: 'Failed to validate deck.' })
      })
  }

  handleAction(playerId: string, action: GameAction): void {
    if (this.state.status !== 'playing') {
      this.sendTo(playerId, { type: 'error', message: 'Game is not in progress.' })
      return
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex]
    if (currentPlayer.id !== playerId) {
      this.sendTo(playerId, { type: 'error', message: 'Not your turn.' })
      return
    }

    this.applyAction(currentPlayer, action)
    this.broadcastState()
  }

  // ---------------------------------------------------------------------------
  // Game logic — replace / extend this section as you build out the game
  // ---------------------------------------------------------------------------

  private applyAction(player: Player, action: GameAction): void {
    switch (action.kind) {
      case 'end_turn': {
        this.log(`${player.name} ended their turn.`)
        this.advanceTurn()
        break
      }
      default:
        this.log(`${player.name} performed action: ${action.kind}`)
    }
  }

  private advanceTurn(): void {
    this.state.currentPlayerIndex = this.state.currentPlayerIndex === 0 ? 1 : 0
    this.state.turn += 1
  }

  private log(entry: string): void {
    this.state.log.push(entry)
  }

  // ---------------------------------------------------------------------------
  // Networking helpers
  // ---------------------------------------------------------------------------

  broadcastState(): void {
    this.broadcast({ type: 'state_update', state: this.state })
  }

  private broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg)
    for (const ws of this.sockets.values()) {
      if (ws.readyState === WebSocket.OPEN) ws.send(data)
    }
  }

  private sendTo(playerId: string, msg: ServerMessage): void {
    const ws = this.sockets.get(playerId)
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
  }
}
