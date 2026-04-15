import { useState } from 'react'
import type { PlayerDeck } from 'shared'
import DeckBuilder from './components/DeckBuilder'
import GameBoard from './components/GameBoard'
import { useGameSocket, type Session } from './hooks/useGameSocket'

type Screen = 'home' | 'deck-builder' | 'create-form' | 'join-form'

const NAME_MIN = 4
const SAVED_DECKS_KEY = 'cp_tcg_saved_decks'

function loadSavedDecks(): PlayerDeck[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_DECKS_KEY) ?? '[]')
  } catch {
    return []
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [session, setSession] = useState<Session | null>(null)

  const { connected, player, gameState, error, sendAction } = useGameSocket(session)

  // ── Connecting spinner ──
  if (session && !connected && !error) {
    return <Layout><p>Connecting…</p></Layout>
  }

  // ── Waiting for opponent ──
  if (connected && player && gameState?.status === 'waiting') {
    return (
      <Layout>
        <h2 style={{ color: MC.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Waiting for opponent…</h2>
        <p style={{ margin: '0.25rem 0 0.75rem', color: MC.border }}>Share this Room ID:</p>
        <code style={{ fontSize: '1.25rem', letterSpacing: '0.1em', background: MC.zoneBg, color: MC.accent, padding: '0.4rem 0.8rem', borderRadius: 4, border: `1px solid ${MC.border}` }}>
          {gameState.roomId}
        </code>
        {error && <p style={{ color: '#ff3b30', marginTop: '0.5rem' }}>{error}</p>}
      </Layout>
    )
  }

  // ── In-game ──
  if (connected && gameState && gameState.status !== 'waiting') {
    return (
      <GameBoard
        gameState={gameState}
        myPlayerId={player?.id ?? null}
        onAction={sendAction}
        error={error}
      />
    )
  }

  // ── Deck builder (standalone) ──
  if (screen === 'deck-builder') {
    return <DeckBuilder onBack={() => setScreen('home')} />
  }

  // ── Home screen ──
  if (screen === 'home') {
    return (
      <Layout>
        <h1 style={{ margin: '0 0 2.5rem', color: MC.accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '2rem' }}>Cyberpunk TCG Sim</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <HexButton onClick={() => setScreen('create-form')}>Create Game</HexButton>
          <HexButton onClick={() => setScreen('join-form')}>Join Game</HexButton>
          <HexButton onClick={() => setScreen('deck-builder')}>Deck Builder</HexButton>
        </div>
      </Layout>
    )
  }

  // ── Create game form ──
  if (screen === 'create-form') {
    return (
      <CreateForm
        serverError={error}
        onBack={() => { setScreen('home'); setSession(null) }}
        onSubmit={(name, deck) => setSession({ mode: 'create', name, deck })}
      />
    )
  }

  // ── Join game form ──
  return (
    <JoinForm
      serverError={error}
      onBack={() => { setScreen('home'); setSession(null) }}
      onSubmit={(name, roomId, deck) => setSession({ mode: 'join', name, roomId, deck })}
    />
  )
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Design tokens (mirrors GameBoard)
// ---------------------------------------------------------------------------

const MC = {
  pageBg:  '#11171e',
  zoneBg:  '#090a13',
  border:  '#504f34',
  text:    '#504f34',
  accent:  '#fcee0a',
} as const

// Elongated hexagon — same clip-path as zone labels on the board
const HEX_CLIP = 'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: MC.pageBg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      
      gap: '0.75rem',
    }}>
      {children}
    </div>
  )
}

/** Elongated-hexagon button matching board zone label style */
function HexButton({
  children,
  onClick,
  disabled = false,
  width = 312,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  width?: number
}) {
  const [hovered, setHovered] = useState(false)
  const active = !disabled && hovered

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width,
        padding: '13px 36px',
        background: disabled ? 'transparent' : active ? '#fff5a0' : MC.accent,
        color: MC.zoneBg,
        border: `2px solid ${disabled ? MC.border : MC.accent}`,
        clipPath: HEX_CLIP,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: active ? '1.15rem' : '1.1rem',
        fontWeight: 700,
        letterSpacing: active ? '0.18em' : '0.1em',
        textTransform: 'uppercase',
        outline: 'none',
        opacity: disabled ? 0.45 : 1,
        transform: active ? 'scale(1.06)' : 'scale(1)',
        filter: active ? `drop-shadow(0 0 10px ${MC.accent}) drop-shadow(0 0 24px ${MC.accent}88)` : 'none',
        transition: 'transform 0.15s, filter 0.15s, background 0.15s, letter-spacing 0.15s, font-size 0.15s',
      }}
    >
      {children}
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.9rem',
  width: 260,
  background: MC.zoneBg,
  color: MC.accent,
  border: `1px solid ${MC.border}`,
  borderRadius: 3,
  outline: 'none',
  
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

// ---------------------------------------------------------------------------

interface CreateFormProps {
  serverError: string | null
  onBack: () => void
  onSubmit: (name: string, deck: PlayerDeck) => void
}

function CreateForm({ serverError, onBack, onSubmit }: CreateFormProps) {
  const [name, setName] = useState('')
  const [deckIndex, setDeckIndex] = useState(0)
  const [localError, setLocalError] = useState('')
  const decks = loadSavedDecks()

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed.length < NAME_MIN) { setLocalError(`Name must be at least ${NAME_MIN} characters.`); return }
    if (decks.length === 0) { setLocalError('No saved decks. Build and save a deck first.'); return }
    setLocalError('')
    onSubmit(trimmed, decks[deckIndex])
  }

  return (
    <Layout>
      <h2 style={{ margin: '0 0 1.5rem', color: MC.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Create Game</h2>
      <input
        autoFocus
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        style={inputStyle}
      />
      {decks.length === 0 ? (
        <p style={{ color: MC.border, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          No saved decks — go to Deck Builder first.
        </p>
      ) : (
        <select
          value={deckIndex}
          onChange={(e) => setDeckIndex(Number(e.target.value))}
          style={selectStyle}
        >
          {decks.map((d, i) => (
            <option key={i} value={i}>{d.name}</option>
          ))}
        </select>
      )}
      {(localError || serverError) && (
        <p style={{ color: '#ff3b30', margin: '0.25rem 0', fontSize: '0.85rem' }}>{localError || serverError}</p>
      )}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
        <HexButton onClick={onBack} width={143}>Back</HexButton>
        <HexButton onClick={submit} disabled={decks.length === 0} width={182}>Create</HexButton>
      </div>
    </Layout>
  )
}

// ---------------------------------------------------------------------------

interface JoinFormProps {
  serverError: string | null
  onBack: () => void
  onSubmit: (name: string, roomId: string, deck: PlayerDeck) => void
}

function JoinForm({ serverError, onBack, onSubmit }: JoinFormProps) {
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [deckIndex, setDeckIndex] = useState(0)
  const [localError, setLocalError] = useState('')
  const decks = loadSavedDecks()

  const submit = () => {
    const trimmedName = name.trim()
    const trimmedRoom = roomId.trim()
    if (trimmedName.length < NAME_MIN) { setLocalError(`Name must be at least ${NAME_MIN} characters.`); return }
    if (!trimmedRoom) { setLocalError('Room ID is required.'); return }
    if (decks.length === 0) { setLocalError('No saved decks. Build and save a deck first.'); return }
    setLocalError('')
    onSubmit(trimmedName, trimmedRoom, decks[deckIndex])
  }

  return (
    <Layout>
      <h2 style={{ margin: '0 0 1.5rem', color: MC.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Join Game</h2>
      <input
        autoFocus
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        style={inputStyle}
      />
      <input
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        style={inputStyle}
      />
      {decks.length === 0 ? (
        <p style={{ color: MC.border, fontSize: '0.85rem', margin: '0.25rem 0' }}>
          No saved decks — go to Deck Builder first.
        </p>
      ) : (
        <select
          value={deckIndex}
          onChange={(e) => setDeckIndex(Number(e.target.value))}
          style={selectStyle}
        >
          {decks.map((d, i) => (
            <option key={i} value={i}>{d.name}</option>
          ))}
        </select>
      )}
      {(localError || serverError) && (
        <p style={{ color: '#ff3b30', margin: '0.25rem 0', fontSize: '0.85rem' }}>{localError || serverError}</p>
      )}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
        <HexButton onClick={onBack} width={143}>Back</HexButton>
        <HexButton onClick={submit} disabled={decks.length === 0} width={169}>Join</HexButton>
      </div>
    </Layout>
  )
}
