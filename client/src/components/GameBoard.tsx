import type { GameAction, GameState } from 'shared'

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
const C = {
  bg: '#090a13',
  border: '#504f34',
  text: '#504f34',
  accent: '#fcee0a',
  outside: '#11171e',
} as const

const CARD_W = 52
const CARD_H = 73
const GAP = 2
const ZONE_PAD_H = 8
const ZONE_PAD_V = 6
const LABEL_H = 18
const LABEL_TOP = 6
const LABEL_CLEARANCE = LABEL_TOP + LABEL_H + 4

// Legend is exactly 3 cards wide
const LEGEND_W = CARD_W * 3 + GAP * 2 + ZONE_PAD_H * 2

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function ZoneLabel({ text, extra }: { text: string; extra?: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: LABEL_TOP,
        left: ZONE_PAD_H,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        zIndex: 1,
      }}
    >
      <span
        style={{
          background: C.accent,
          color: '#090a13',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          lineHeight: `${LABEL_H}px`,
          padding: '0 12px',
          clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)',
        }}
      >
        {text}
      </span>
      {extra}
    </div>
  )
}

function Zone({
  label,
  labelExtra,
  children,
  style,
}: {
  label: string
  labelExtra?: React.ReactNode
  children?: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        position: 'relative',
        background: C.bg,
        border: 'none',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${LABEL_CLEARANCE}px ${ZONE_PAD_H}px ${ZONE_PAD_V}px`,
        gap: 4,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <ZoneLabel text={label} extra={labelExtra} />
      {children}
    </div>
  )
}

function CardSlot({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        border: `1px dashed ${C.border}`,
        borderRadius: 3,
        flexShrink: 0,
        opacity: 0.3,
        ...style,
      }}
    />
  )
}

function FaceDownCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: '#1a1b26',
        border: `1px solid ${C.border}`,
        borderRadius: 3,
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

const DIE_FACES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'] as const


// ---------------------------------------------------------------------------
// Board zones
// ---------------------------------------------------------------------------

function FixerArea({ style }: { style?: React.CSSProperties }) {
  return (
    <Zone label="Fixer" style={{ flexShrink: 0, width: 72, ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, width: '100%', flex: 1, alignSelf: 'stretch' }}>
        {DIE_FACES.map((f) => (
          <div
            key={f}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              background: C.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: C.text,
              cursor: 'default',
              width: '100%',
              flex: 1,
            }}
          >
            {f}
          </div>
        ))}
      </div>
    </Zone>
  )
}

function FieldArea({ rowCount = 1, style }: { rowCount?: number; style?: React.CSSProperties }) {
  const cardGap = rowCount === 1 ? 12 : 6

  return (
    <Zone label="Field" style={{ flex: 1, ...style }}>
      {/* 75% of zone content height, centered vertically */}
      <div
        style={{
          height: '75%',
          display: 'flex',
          flexDirection: 'column',
          gap: cardGap,
        }}
      >
        {Array.from({ length: rowCount }).map((_, row) => (
          <div
            key={row}
            style={{ display: 'flex', gap: cardGap, flex: 1, justifyContent: 'center' }}
          >
            {Array.from({ length: 5 }).map((_, col) => (
              <div
                key={col}
                style={{
                  height: '100%',
                  aspectRatio: `${CARD_W} / ${CARD_H}`,
                  border: `1px dashed ${C.border}`,
                  borderRadius: 3,
                  opacity: 0.3,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </Zone>
  )
}

function CardPile({ label, count = 0 }: { label: string; count?: number }) {
  return (
    <Zone label={label} style={{ flexShrink: 0, width: CARD_W + ZONE_PAD_H * 2 }}>
      <div style={{ position: 'relative', width: CARD_W, height: CARD_H, flexShrink: 0 }}>
        {[2, 1, 0].map((o) => (
          <div
            key={o}
            style={{
              position: 'absolute',
              top: -o * 2,
              left: o * 2,
              width: CARD_W,
              height: CARD_H,
              background: '#1a1b26',
              border: `1px solid ${C.border}`,
              borderRadius: 3,
            }}
          />
        ))}
        {/* Count overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: C.accent,
            zIndex: 1,
          }}
        >
          {count}
        </div>
      </div>
    </Zone>
  )
}

function DeckTrashArea({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: GAP,
        ...style,
      }}
    >
      <CardPile label="Deck" />
      <CardPile label="Trash" />
    </div>
  )
}

function LegendArea({ style }: { style?: React.CSSProperties }) {
  return (
    <Zone label="Legends" style={{ width: LEGEND_W, flexShrink: 0, ...style }}>
      <div style={{ display: 'flex', gap: GAP }}>
        {[0, 1, 2].map((i) => <FaceDownCard key={i} />)}
      </div>
    </Zone>
  )
}

function RivalLegendArea({ style }: { style?: React.CSSProperties }) {
  return (
    <Zone label="Legends" style={{ width: LEGEND_W, flexShrink: 0, ...style }}>
      <div style={{ display: 'flex', gap: GAP }}>
        {[0, 1, 2].map((i) => <FaceDownCard key={i} />)}
      </div>
    </Zone>
  )
}

function EddiesArea({ style }: { style?: React.CSSProperties }) {
  return (
    <Zone label="Eddies" style={{ flex: 1, alignItems: 'flex-start', ...style }}>
      <div style={{ display: 'flex', gap: GAP, flexWrap: 'wrap' }}>
        <CardSlot />
      </div>
    </Zone>
  )
}

function GigZones({ style }: { style?: React.CSSProperties }) {
  const dieOutline = (
    <div style={{
      width: 36,
      height: 28,
      border: `1px dashed ${C.border}`,
      borderRadius: 3,
      opacity: 0.3,
    }} />
  )
  return (
    <div style={{ display: 'flex', gap: GAP, flexShrink: 0, ...style }}>
      <Zone label="Rival Gigs" style={{ flex: 1 }}>{dieOutline}</Zone>
      <Zone label="Friendly Gigs" style={{ flex: 1 }}>{dieOutline}</Zone>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Board halves
// ---------------------------------------------------------------------------

function RivalBoard({ name, handCount }: { name: string; handCount: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 9, height: 13, background: '#1a1b26', border: `1px solid ${C.border}`, borderRadius: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{handCount}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: GAP, flexShrink: 0 }}>
        <RivalLegendArea />
        <EddiesArea />
      </div>
      <div style={{ display: 'flex', gap: GAP, flex: 1, alignItems: 'stretch' }}>
        <FixerArea />
        <FieldArea />
        <DeckTrashArea />
      </div>
    </div>
  )
}

function PlayerBoard({ name }: { name: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, flex: 1 }}>
      <div style={{ display: 'flex', gap: GAP, flex: 1, alignItems: 'stretch' }}>
        <FixerArea />
        <FieldArea />
        <DeckTrashArea />
      </div>
      <div style={{ display: 'flex', gap: GAP, flexShrink: 0 }}>
        <LegendArea />
        <EddiesArea />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {name}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bottom HUD row
// ---------------------------------------------------------------------------

function HandAndControls({
  isMyTurn,
  onEndTurn,
  error,
}: {
  isMyTurn: boolean
  onEndTurn: () => void
  error: string | null
}) {
  const HAND_SIZE = 7

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: GAP,
        flexShrink: 0,
        height: CARD_H + LABEL_CLEARANCE + ZONE_PAD_V,
      }}
    >
      {/* Left — turn status */}
      <div style={{ width: LEGEND_W, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, letterSpacing: '0.06em' }}>
          {isMyTurn ? '⚡ Your turn' : "Opponent's turn"}
        </div>
        {error && <div style={{ color: '#c84b4b', fontSize: 11, marginTop: 4 }}>{error}</div>}
      </div>

      {/* Center — hand */}
      <Zone label="Hand" style={{ flex: 1, alignSelf: 'stretch' }}>
        <div style={{ display: 'flex', gap: GAP }}>
          {Array.from({ length: HAND_SIZE }).map((_, i) => (
            <CardSlot key={i} style={{ opacity: 0.5 }} />
          ))}
        </div>
      </Zone>

      {/* Right — end turn */}
      <div style={{ flexShrink: 0, alignSelf: 'stretch', display: 'flex', alignItems: 'center', marginLeft: 8, marginRight: 8 }}>
        <button
          disabled={!isMyTurn}
          onClick={onEndTurn}
          style={{
            background: isMyTurn ? C.accent : 'transparent',
            border: `2px solid ${isMyTurn ? C.accent : 'rgb(255, 59, 48)'}`,
            color: isMyTurn ? '#090a13' : 'rgb(255, 59, 48)',
            padding: '8px 24px',
            cursor: isMyTurn ? 'pointer' : 'not-allowed',
            borderRadius: 3,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          }}
        >
          End Turn
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

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

  if (gameState.status === 'waiting') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80, color: C.text, fontFamily: 'sans-serif' }}>
        Waiting for opponent…
      </div>
    )
  }

  if (gameState.status === 'finished') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80, color: C.text, fontFamily: 'sans-serif' }}>
        {gameState.winner === myPlayerId
          ? 'You win!'
          : `${gameState.players.find((p) => p.id === gameState.winner)?.name ?? 'Opponent'} wins!`}
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: C.outside,
        display: 'flex',
        flexDirection: 'column',
        padding: 8,
        gap: GAP,
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
      }}
    >
      <RivalBoard name={opponent?.name ?? 'Rival'} handCount={0} />
      <GigZones style={{ flexShrink: 0 }} />
      <PlayerBoard name={me?.name ?? 'You'} />
      <HandAndControls
        isMyTurn={isMyTurn}
        onEndTurn={() => onAction({ kind: 'end_turn' })}
        error={error}
      />
    </div>
  )
}
