import { useState } from 'react'
import GameBoard from './components/GameBoard'
import { useGameSocket, type Session } from './hooks/useGameSocket'

type Screen = 'home' | 'create-form' | 'join-form'

const NAME_MIN = 4

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [session, setSession] = useState<Session | null>(null)

  const { connected, player, gameState, error, sendAction } = useGameSocket(session)

  // ── Connecting spinner ──
  if (session && !connected && !error) {
    return <Layout><p>Connecting…</p></Layout>
  }

  // ── Waiting for opponent (creator, before second player joins) ──
  if (connected && player && gameState?.status === 'waiting') {
    return (
      <Layout>
        <h2>Waiting for opponent…</h2>
        <p style={{ margin: '0.25rem 0 0.75rem' }}>Share this Room ID with your opponent:</p>
        <code style={{ fontSize: '1.25rem', letterSpacing: '0.1em', background: '#f0f0f0', padding: '0.4rem 0.8rem', borderRadius: 4 }}>
          {gameState.roomId}
        </code>
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

  // ── Home screen ──
  if (screen === 'home') {
    return (
      <Layout>
        <h1 style={{ margin: '0 0 2rem' }}>CP TCG Sim</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: 220 }}>
          <button onClick={() => setScreen('create-form')}>Create Game</button>
          <button onClick={() => setScreen('join-form')}>Join Game</button>
        </div>
      </Layout>
    )
  }

  // ── Create game form ──
  if (screen === 'create-form') {
    return (
      <NameForm
        title="Create Game"
        submitLabel="Create"
        serverError={error}
        onBack={() => { setScreen('home'); setSession(null) }}
        onSubmit={(name) => setSession({ mode: 'create', name })}
      />
    )
  }

  // ── Join game form ──
  return (
    <JoinForm
      serverError={error}
      onBack={() => { setScreen('home'); setSession(null) }}
      onSubmit={(name, roomId) => setSession({ mode: 'join', name, roomId })}
    />
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 100, fontFamily: 'sans-serif', gap: '0.5rem' }}>
      {children}
    </div>
  )
}

interface NameFormProps {
  title: string
  submitLabel: string
  serverError: string | null
  onBack: () => void
  onSubmit: (name: string) => void
}

function NameForm({ title, submitLabel, serverError, onBack, onSubmit }: NameFormProps) {
  const [name, setName] = useState('')
  const [localError, setLocalError] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed.length < NAME_MIN) {
      setLocalError(`Name must be at least ${NAME_MIN} characters.`)
      return
    }
    setLocalError('')
    onSubmit(trimmed)
  }

  return (
    <Layout>
      <h2 style={{ margin: '0 0 1rem' }}>{title}</h2>
      <input
        autoFocus
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        style={{ padding: '0.5rem', fontSize: '1rem', width: 220 }}
      />
      {(localError || serverError) && (
        <p style={{ color: 'crimson', margin: '0.25rem 0' }}>{localError || serverError}</p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={onBack}>Back</button>
        <button onClick={submit}>{submitLabel}</button>
      </div>
    </Layout>
  )
}

interface JoinFormProps {
  serverError: string | null
  onBack: () => void
  onSubmit: (name: string, roomId: string) => void
}

function JoinForm({ serverError, onBack, onSubmit }: JoinFormProps) {
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [localError, setLocalError] = useState('')

  const submit = () => {
    const trimmedName = name.trim()
    const trimmedRoom = roomId.trim()
    if (trimmedName.length < NAME_MIN) {
      setLocalError(`Name must be at least ${NAME_MIN} characters.`)
      return
    }
    if (!trimmedRoom) {
      setLocalError('Room ID is required.')
      return
    }
    setLocalError('')
    onSubmit(trimmedName, trimmedRoom)
  }

  return (
    <Layout>
      <h2 style={{ margin: '0 0 1rem' }}>Join Game</h2>
      <input
        autoFocus
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        style={{ padding: '0.5rem', fontSize: '1rem', width: 220 }}
      />
      <input
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        style={{ padding: '0.5rem', fontSize: '1rem', width: 220 }}
      />
      {(localError || serverError) && (
        <p style={{ color: 'crimson', margin: '0.25rem 0' }}>{localError || serverError}</p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button onClick={onBack}>Back</button>
        <button onClick={submit}>Join</button>
      </div>
    </Layout>
  )
}
