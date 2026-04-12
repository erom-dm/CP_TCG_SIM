import type { Card, Deck, PlayerDeck } from 'shared'
import { DECK_LEGEND_COUNT, DECK_MAX_SIZE, DECK_MIN_SIZE } from 'shared'
import { getCards } from './data.js'

// ---------------------------------------------------------------------------
// Lookup map — built lazily from the cached card pool
// ---------------------------------------------------------------------------

export async function getCardsById(): Promise<Map<string, Card>> {
  const cards = await getCards()
  return new Map(cards.map((c) => [c.id, c]))
}

// ---------------------------------------------------------------------------
// Deck validation
// ---------------------------------------------------------------------------

export interface DeckValidationError {
  field: 'cards' | 'legends' | 'id'
  message: string
}

/**
 * Validates a PlayerDeck against the pool and deck-building rules.
 * Returns an empty array when the deck is legal.
 */
export async function validatePlayerDeck(deck: PlayerDeck): Promise<DeckValidationError[]> {
  const errors: DeckValidationError[] = []
  const cardsById = await getCardsById()

  if (deck.cardIds.length < DECK_MIN_SIZE || deck.cardIds.length > DECK_MAX_SIZE) {
    errors.push({
      field: 'cards',
      message: `Deck must contain ${DECK_MIN_SIZE}–${DECK_MAX_SIZE} regular cards (got ${deck.cardIds.length}).`,
    })
  }

  if (deck.legendIds.length !== DECK_LEGEND_COUNT) {
    errors.push({
      field: 'legends',
      message: `Deck must contain exactly ${DECK_LEGEND_COUNT} legend cards (got ${deck.legendIds.length}).`,
    })
  }

  for (const id of deck.cardIds) {
    const card = cardsById.get(id)
    if (!card) {
      errors.push({ field: 'id', message: `Unknown card id: "${id}".` })
    } else if (card.card_type.toLowerCase() === 'legend') {
      errors.push({ field: 'cards', message: `Card "${id}" is a Legend and cannot be in the regular card slots.` })
    }
  }

  for (const id of deck.legendIds) {
    const card = cardsById.get(id)
    if (!card) {
      errors.push({ field: 'id', message: `Unknown card id: "${id}".` })
    } else if (card.card_type.toLowerCase() !== 'legend') {
      errors.push({ field: 'legends', message: `Card "${id}" is not a Legend card.` })
    }
  }

  return errors
}

/**
 * Resolves a valid PlayerDeck into a full Deck with card objects attached.
 * Call only after validatePlayerDeck returns no errors.
 */
export async function resolveDeck(deck: PlayerDeck): Promise<Deck> {
  const cardsById = await getCardsById()
  return {
    name: deck.name,
    cards: deck.cardIds.map((id) => cardsById.get(id)!),
    legends: deck.legendIds.map((id) => cardsById.get(id)!) as Deck['legends'],
  }
}

// ---------------------------------------------------------------------------
// Convenience re-export
// ---------------------------------------------------------------------------

export { getCards }
