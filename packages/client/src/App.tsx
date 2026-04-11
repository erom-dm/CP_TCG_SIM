import { useState } from 'react';
import GameBoard from './components/GameBoard';
import { useGameSocket } from './hooks/useGameSocket';

export default function App() {
  const [nameInput, setNameInput] = useState('');
  const [playerName, setPlayerName] = useState('');

  const { connected, player, gameState, error, sendAction } = useGameSocket(playerName);

  // ── Name entry screen ──
  if (!playerName) {
    const submit = () => {
      const trimmed = nameInput.trim();
      if (trimmed) setPlayerName(trimmed);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 120, fontFamily: 'sans-serif', gap: '0.75rem' }}>
        <h1>CP TCG Sim</h1>
        <input
          autoFocus
          placeholder="Enter your name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          style={{ padding: '0.5rem', fontSize: '1rem', width: 220 }}
        />
        <button onClick={submit} style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}>
          Join Game
        </button>
      </div>
    );
  }

  // ── Loading screens ──
  if (!connected) return <p style={{ fontFamily: 'sans-serif', padding: '2rem' }}>Connecting…</p>;
  if (!gameState) return <p style={{ fontFamily: 'sans-serif', padding: '2rem' }}>Waiting for game state…</p>;

  // ── Game ──
  return (
    <GameBoard
      gameState={gameState}
      myPlayerId={player?.id ?? null}
      onAction={sendAction}
      error={error}
    />
  );
}
