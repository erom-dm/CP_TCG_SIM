// ---------------------------------------------------------------------------
// Card types — mirroring the netdeck.gg API shape
// ---------------------------------------------------------------------------

export interface CardSet {
  code: string
  name: string
}

export interface Card {
  id: string
  external_id: string
  name: string
  subname: string | null
  display_name: string
  slug: string
  rules_text: string
  flavor_text: string | null
  set: CardSet
  rarity: string | null
  image_url: string
  source_image_url: string
  color: string
  card_type: string
  is_eddiable: boolean
  classifications: string[]
  keywords: string[]
  cost: number
  power: number
  ram: number
  artist: string
  print_number: string
  printings: unknown[]
  selected_printing_id: string | null
  legality: string
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
  /** Card IDs (UUID strings), 40–50 entries. Must not include Legend-type cards. */
  cardIds: string[]
  /** IDs of exactly 3 cards with card_type "Legend" */
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
