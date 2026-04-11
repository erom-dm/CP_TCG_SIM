import type { GameAction, GameState } from 'shared'

interface Props {
  gameState: GameState
  myPlayerId: string | null
  onAction: (action: GameAction) => void
  error: string | null
}

export default function GameBoard({ gameState, myPlayerId, onAction, error }: Props) {
  const me = gameState.players.find((p) => p.id === myPlayerId)
  const opponent = gameState.players.find((p) => p.id !== myPlayerId)
  const current = gameState.players[gameState.currentPlayerIndex]
  const isMyTurn = current?.id === myPlayerId

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Room {gameState.roomId.slice(0, 8)}</h2>
        <span style={{ fontSize: '0.875rem', color: '#666' }}>
          Turn {gameState.turn} &mdash; {gameState.status}
        </span>
      </header>

      <hr />

      {gameState.status === 'waiting' && (
        <p>Waiting for an opponent to join...</p>
      )}

      {gameState.status === 'playing' && (
        <section>
          <p>
            <strong>You:</strong> {me?.name ?? '—'} &nbsp;|&nbsp
            <strong>Opponent:</strong> {opponent?.name ?? '—'}
          </p>
          <p style={{ fontSize: '1.1rem' }}>
            {isMyTurn ? '⚡ Your turn' : `Waiting for ${current?.name ?? 'opponent'}...`}
          </p>

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1rem 0' }}>
            <button
              disabled={!isMyTurn}
              onClick={() => onAction({ kind: 'end_turn' })}
            >
              End Turn
            </button>
            {/* Add more action buttons here */}
          </div>

          {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </section>
      )}

      {gameState.status === 'finished' && (
        <p>
          Game over!{' '}
          {gameState.winner === myPlayerId
            ? 'You win!'
            : `${gameState.players.find((p) => p.id === gameState.winner)?.name ?? 'Opponent'} wins!`}
        </p>
      )}

      <hr />

      <section>
        <h3 style={{ margin: '0 0 0.5rem' }}>Log</h3>
        <ul style={{ margin: 0, padding: '0 1rem', maxHeight: 200, overflowY: 'auto' }}>
          {[...gameState.log].reverse().map((entry, i) => (
            <li key={i} style={{ fontSize: '0.875rem' }}>
              {entry}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
