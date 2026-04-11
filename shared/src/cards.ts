// ---------------------------------------------------------------------------
// Card types — shared between server (data) and client (deck selection UI)
// ---------------------------------------------------------------------------

export type CardType =
  | 'unit'
  | 'event'
  | 'hardware'
  | 'software'
  | 'location'
  | 'legend'

export type CardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'legendary'

export type CardTag =
  | 'corp'
  | 'runner'
  | 'ai'
  | 'drone'
  | 'weapon'
  | 'vehicle'
  | 'cyber'
  | 'viral'
  | 'stealth'
  | 'breach'

export type AbilityTrigger =
  | 'on_play'
  | 'on_attack'
  | 'on_death'
  | 'passive'
  | 'activated'

export interface Ability {
  name: string
  description: string
  trigger: AbilityTrigger
  /** Intentionally open — shape will evolve with game design */
  effect: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Card definitions
// ---------------------------------------------------------------------------

export interface Card {
  /** Unique string key: "{set}_{serialNumber}" e.g. "alpha_1" */
  id: string
  /** Numeric part of the id — unique within a set */
  serialNumber: number
  /** The release set this card belongs to e.g. "alpha" */
  set: string
  name: string
  subtitle: string | null
  type: CardType
  rarity: CardRarity
  tags: CardTag[]
  ram: number
  cost: number
  power: number
  sellTag: boolean
  abilities: Ability[]
  /** Filename served from the server's static/cards/ folder (e.g. "card_001.png") */
  image: string
}

// ---------------------------------------------------------------------------
// Deck types
// ---------------------------------------------------------------------------

/**
 * Lightweight deck representation used on the wire and in browser localStorage.
 * Contains only IDs — the server resolves these to full card objects.
 */
export interface PlayerDeck {
  name: string
  /** Card IDs in "{set}_{serialNumber}" format, 40–50 entries. Must not include legend-type cards. */
  cardIds: string[]
  /** IDs of exactly 3 cards with type "legend" */
  legendIds: [string, string, string]
}

/**
 * Fully resolved deck — card objects attached.
 * Produced server-side after validating a PlayerDeck.
 */
export interface Deck {
  name: string
  cards: Card[]
  legends: [Card, Card, Card]
}

export const DECK_MIN_SIZE = 40
export const DECK_MAX_SIZE = 50
export const DECK_LEGEND_COUNT = 3
