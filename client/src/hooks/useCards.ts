import { useEffect, useState } from 'react'
import type { Card } from 'shared'

const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api/cards' : '/api/cards'
const CACHE_KEY = 'cp_tcg_cards_v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface CacheEntry {
  cards: Card[]
  fetchedAt: number
}

export function useCards() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const entry: CacheEntry = JSON.parse(raw)
        if (Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
          setCards(entry.cards)
          setLoading(false)
          return
        }
      }
    } catch {
      // corrupted cache — fall through to fetch
    }

    fetch(API_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<{ cards: Card[] }>
      })
      .then(({ cards }) => {
        try {
          const entry: CacheEntry = { cards, fetchedAt: Date.now() }
          localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
        } catch {
          // storage full — skip caching
        }
        setCards(cards)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load cards. Check that the game server is running.')
        setLoading(false)
      })
  }, [])

  return { cards, loading, error }
}
