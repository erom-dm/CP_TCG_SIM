import { useMemo, useState } from 'react'
import type { Card, PlayerDeck } from 'shared'
import { useCards } from '../hooks/useCards'

const DECK_MIN = 40
const DECK_MAX = 50
const LEGEND_COUNT = 3
const MAX_COPIES = 3
const SAVED_DECKS_KEY = 'cp_tcg_saved_decks'

interface Props {
  roomId?: string
  onSave?: (deck: PlayerDeck) => void
  serverError?: string | null
  onBack?: () => void
}

export default function DeckBuilder({ roomId, onSave, serverError, onBack }: Props) {
  const { cards, loading, error: cardsError } = useCards()
  const [legends, setLegends] = useState<Card[]>([])
  const [mainDeck, setMainDeck] = useState<Card[]>([])
  const [deckName, setDeckName] = useState('My Deck')
  const [legendsOpen, setLegendsOpen] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null)

  // ── RAM budget ────────────────────────────────────────────────────────────
  const ramByColor = useMemo(() => {
    const map: Record<string, number> = {}
    for (const leg of legends) {
      map[leg.color] = (map[leg.color] ?? 0) + leg.ram
    }
    return map
  }, [legends])

  const isCardAvailable = (card: Card) =>
    card.ram <= (ramByColor[card.color] ?? 0)

  const copyCount = (cardId: string) => mainDeck.filter((c) => c.id === cardId).length

  // ── Card interaction ──────────────────────────────────────────────────────
  const handleCardClick = (card: Card) => {
    if (card.card_type === 'Legend') {
      if (legends.length >= LEGEND_COUNT) return
      if (legends.some((l) => l.id === card.id)) return
      setLegends((prev) => [...prev, card])
    } else {
      if (!isCardAvailable(card)) return
      if (mainDeck.length >= DECK_MAX) return
      if (copyCount(card.id) >= MAX_COPIES) return
      setMainDeck((prev) => [...prev, card])
    }
  }

  const removeLegend = (idx: number) => {
    const newLegends = legends.filter((_, i) => i !== idx)
    const newRam: Record<string, number> = {}
    for (const leg of newLegends) {
      newRam[leg.color] = (newRam[leg.color] ?? 0) + leg.ram
    }
    setLegends(newLegends)
    setMainDeck((prev) => prev.filter((c) => c.ram <= (newRam[c.color] ?? 0)))
  }

  // Left-click: add one copy; right-click: remove one copy
  const handleDeckCardClick = (card: Card) => {
    if (!isCardAvailable(card)) return
    if (mainDeck.length >= DECK_MAX) return
    if (copyCount(card.id) >= MAX_COPIES) return
    setMainDeck((prev) => [...prev, card])
  }

  const handleDeckCardRightClick = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault()
    setMainDeck((prev) => {
      const idx = [...prev].reverse().findIndex((c) => c.id === cardId)
      if (idx === -1) return prev
      const real = prev.length - 1 - idx
      return prev.filter((_, i) => i !== real)
    })
  }

  // ── Deck display ──────────────────────────────────────────────────────────
  const mainDeckGroups = useMemo(() => {
    const map = new Map<string, { card: Card; count: number }>()
    for (const card of mainDeck) {
      const entry = map.get(card.id)
      if (entry) entry.count++
      else map.set(card.id, { card, count: 1 })
    }
    return Array.from(map.values())
  }, [mainDeck])

  // ── Save ──────────────────────────────────────────────────────────────────
  const isValid =
    legends.length === LEGEND_COUNT &&
    mainDeck.length >= DECK_MIN &&
    mainDeck.length <= DECK_MAX

  const handleSave = () => {
    if (!isValid) return
    const deck: PlayerDeck = {
      name: deckName,
      cardIds: mainDeck.map((c) => c.id),
      legendIds: [legends[0].id, legends[1].id, legends[2].id],
    }
    try {
      const existing: PlayerDeck[] = JSON.parse(localStorage.getItem(SAVED_DECKS_KEY) ?? '[]')
      const updated = [...existing.filter((d) => d.name !== deck.name), deck]
      localStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(updated))
    } catch {
      // storage full — skip
    }
    onSave?.(deck)
  }

  const legendCards = cards.filter((c) => c.card_type === 'Legend')
  const regularCards = cards.filter((c) => c.card_type !== 'Legend')

  if (loading) {
    return <div style={styles.centered}><p style={{ color: '#888' }}>Loading cards…</p></div>
  }
  if (cardsError) {
    return <div style={styles.centered}><p style={{ color: 'crimson' }}>{cardsError}</p></div>
  }

  return (
    <div style={styles.root}>

      {/* ── Card hover popup ── */}
      {hoveredCard && (
        <div style={styles.popup}>
          <img src={hoveredCard.image_url} alt={hoveredCard.display_name} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
        </div>
      )}

      {/* ── Card grid — 80% ── */}
      <div style={styles.grid}>

        {/* Header */}
        <div style={styles.banner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {onBack && <button onClick={onBack} style={styles.backBtn}>← Back</button>}
            <span style={{ fontWeight: 600 }}>Deck Builder</span>
          </div>
          {roomId && (
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
              Room:&nbsp;<code style={{ color: '#ccc' }}>{roomId.slice(0, 8)}</code>
            </span>
          )}
        </div>

        {/* Legends section — collapsible */}
        <div
          style={styles.sectionHeader}
          onClick={() => setLegendsOpen((o) => !o)}
        >
          <h3 style={styles.sectionTitle}>
            <span style={{ marginRight: '0.4rem', display: 'inline-block', transition: 'transform 0.15s', transform: legendsOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
            Legends
          </h3>
        </div>
        {legendsOpen && (
          <div style={{ ...styles.cardGrid, marginBottom: '1.5rem' }}>
            {legendCards.map((card) => {
              const selected = legends.some((l) => l.id === card.id)
              const full = !selected && legends.length >= LEGEND_COUNT
              return (
                <CardTile
                  key={card.id}
                  card={card}
                  badge={selected ? '★' : null}
                  dimmed={full}
                  onClick={() => handleCardClick(card)}
                />
              )
            })}
          </div>
        )}

        {/* Regular cards section */}
        <h3 style={styles.sectionTitle}>
          Cards
          {legends.length > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#aaa', marginLeft: '0.75rem' }}>
              RAM budget:&nbsp;
              {Object.entries(ramByColor).map(([color, ram]) => (
                <span key={color}>
                  <span style={{ color: colorHex(color) }}>●</span> {color} {ram}&nbsp;
                </span>
              ))}
            </span>
          )}
          {legends.length === 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#666', marginLeft: '0.75rem' }}>
              Select legends first to unlock cards
            </span>
          )}
        </h3>
        <div style={styles.cardGrid}>
          {regularCards.map((card) => {
            const available = isCardAvailable(card)
            const count = copyCount(card.id)
            const maxed = count >= MAX_COPIES || mainDeck.length >= DECK_MAX
            return (
              <CardTile
                key={card.id}
                card={card}
                badge={count > 0 ? `×${count}` : null}
                dimmed={!available}
                faded={available && maxed}
                onClick={() => handleCardClick(card)}
              />
            )
          })}
        </div>
      </div>

      {/* ── Right panel — 20% ── */}
      <div style={styles.panel}>

        {/* Legend slots — pinned */}
        <div style={styles.legendSlots}>
          <div style={styles.panelLabel}>Legends ({legends.length}/{LEGEND_COUNT})</div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={styles.legendSlot}>
              {legends[i] ? (
                <>
                  <div style={{
                    width: 23,
                    height: 23,
                    borderRadius: '50%',
                    background: colorHex(legends[i].color),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: colorTextContrast(legends[i].color),
                    flexShrink: 0,
                  }}>
                    {legends[i].ram}
                  </div>
                  <span style={{ fontSize: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {legends[i].display_name}
                  </span>
                  <button style={styles.removeBtn} onClick={() => removeLegend(i)}>×</button>
                </>
              ) : (
                <span style={{ color: '#555', fontSize: '0.75rem' }}>— empty slot —</span>
              )}
            </div>
          ))}
        </div>

        {/* Card count */}
        <div style={styles.deckCount}>
          {mainDeck.length} / {DECK_MAX} cards
          {mainDeck.length < DECK_MIN && (
            <span style={{ color: '#666' }}> · need {DECK_MIN - mainDeck.length} more</span>
          )}
          {mainDeck.length >= DECK_MIN && (
            <span style={{ color: '#5a5' }}> · ✓</span>
          )}
        </div>

        {/* Card list — scrollable */}
        <div style={styles.cardList}>
          {mainDeckGroups.length === 0 && (
            <p style={{ color: '#444', fontSize: '0.75rem', margin: 0 }}>No cards added yet.</p>
          )}
          {mainDeckGroups.map(({ card, count }) => (
            <div
              key={card.id}
              style={styles.cardListRow}
              title="Left-click to add a copy · Right-click to remove one"
              onClick={() => handleDeckCardClick(card)}
              onContextMenu={(e) => handleDeckCardRightClick(e, card.id)}
              onMouseEnter={() => setHoveredCard(card)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <span style={{ fontSize: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: colorHex(card.color) }}>●</span>{' '}
                {card.display_name}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: 4, flexShrink: 0 }}>×{count}</span>
            </div>
          ))}
        </div>

        {/* Save */}
        <div style={styles.saveArea}>
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            style={styles.deckNameInput}
            placeholder="Deck name"
          />
          {serverError && (
            <p style={{ color: 'crimson', fontSize: '0.75rem', margin: '0 0 0.5rem' }}>{serverError}</p>
          )}
          <button
            onClick={handleSave}
            disabled={!isValid}
            style={{ ...styles.saveBtn, opacity: isValid ? 1 : 0.5, cursor: isValid ? 'pointer' : 'not-allowed' }}
          >
            {isValid
              ? onSave ? 'Save & Submit Deck' : 'Save Deck'
              : `${legends.length}/3 legends · ${mainDeck.length} cards`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card tile ──────────────────────────────────────────────────────────────

interface TileProps {
  card: Card
  badge: string | null
  dimmed?: boolean
  faded?: boolean
  onClick: () => void
}

function CardTile({ card, badge, dimmed, faded, onClick }: TileProps) {
  return (
    <div
      onClick={dimmed ? undefined : onClick}
      title={`${card.display_name} · ${card.color} · RAM ${card.ram} · Cost ${card.cost}`}
      style={{
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        cursor: dimmed ? 'not-allowed' : 'pointer',
        opacity: dimmed ? 0.25 : faded ? 0.55 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        outline: badge ? '2px solid gold' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!dimmed) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
      }}
    >
      <img
        src={card.image_url}
        alt={card.display_name}
        style={{ width: '100%', display: 'block' }}
        loading="lazy"
      />
      {badge && <div style={styles.badge}>{badge}</div>}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function colorHex(color: string): string {
  const map: Record<string, string> = {
    Red: '#e05050',
    Blue: '#5088e0',
    Green: '#50a050',
    Yellow: '#c8a020',
    Black: '#888',
    White: '#ccc',
    Purple: '#9060c0',
  }
  return map[color] ?? '#aaa'
}

function colorTextContrast(color: string): string {
  return color === 'White' || color === 'Yellow' ? '#111' : '#fff'
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
    background: '#111',
    color: '#eee',
  } as React.CSSProperties,

  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
    background: '#111',
    color: '#eee',
  } as React.CSSProperties,

  popup: {
    position: 'fixed',
    top: '50%',
    right: 'calc(20% + 10px)',
    transform: 'translateY(-50%)',
    width: 520,
    zIndex: 100,
    pointerEvents: 'none',
    filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.8))',
    borderRadius: 8,
    overflow: 'hidden',
  } as React.CSSProperties,

  grid: {
    width: '80%',
    overflowY: 'auto',
    padding: '1rem 1.25rem',
    boxSizing: 'border-box',
  } as React.CSSProperties,

  banner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #333',
  } as React.CSSProperties,

  backBtn: {
    background: 'none',
    border: '1px solid #444',
    color: '#aaa',
    borderRadius: 4,
    padding: '0.25rem 0.6rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
  } as React.CSSProperties,

  sectionHeader: {
    cursor: 'pointer',
    userSelect: 'none',
    marginBottom: '0.4rem',
  } as React.CSSProperties,

  sectionTitle: {
    margin: '0 0 0.6rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#aaa',
    letterSpacing: '0.05em',
  } as React.CSSProperties,

  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  } as React.CSSProperties,

  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    background: 'rgba(0,0,0,0.8)',
    color: '#ffd700',
    borderRadius: 12,
    padding: '1px 7px',
    fontSize: '0.75rem',
    fontWeight: 700,
    pointerEvents: 'none',
  } as React.CSSProperties,

  panel: {
    width: '20%',
    borderLeft: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#1a1a1a',
  } as React.CSSProperties,

  legendSlots: {
    padding: '0.75rem',
    borderBottom: '1px solid #333',
  } as React.CSSProperties,

  panelLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#777',
    marginBottom: '0.5rem',
  } as React.CSSProperties,

  legendSlot: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 36,
    border: '1px solid #2a2a2a',
    borderRadius: 4,
    padding: '0 0.5rem',
    marginBottom: '0.35rem',
    background: '#222',
    gap: '0.5rem',
  } as React.CSSProperties,

  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#555',
    fontSize: '1rem',
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
  } as React.CSSProperties,

  deckCount: {
    padding: '0.4rem 0.75rem',
    fontSize: '0.75rem',
    color: '#aaa',
    borderBottom: '1px solid #2a2a2a',
  } as React.CSSProperties,

  cardList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem 0.75rem',
  } as React.CSSProperties,

  cardListRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 0',
    borderBottom: '1px solid #222',
    cursor: 'pointer',
    gap: '0.2rem',
  } as React.CSSProperties,

  saveArea: {
    padding: '0.75rem',
    borderTop: '1px solid #333',
  } as React.CSSProperties,

  deckNameInput: {
    width: '100%',
    padding: '0.35rem 0.5rem',
    fontSize: '0.8rem',
    boxSizing: 'border-box' as const,
    marginBottom: '0.5rem',
    borderRadius: 4,
    border: '1px solid #444',
    background: '#222',
    color: '#eee',
  } as React.CSSProperties,

  saveBtn: {
    width: '100%',
    padding: '0.55rem',
    fontWeight: 700,
    fontSize: '0.85rem',
    borderRadius: 4,
    border: 'none',
    background: '#c8a020',
    color: '#111',
  } as React.CSSProperties,
} as const
