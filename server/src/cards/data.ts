import type { Card } from 'shared'

const API_URL = 'https://api.netdeck.gg/api/cards/cyberpunk'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const PAGE_SIZE = 100

interface ApiPage {
  offset: number
  limit: number
  total: number
  items: Card[]
}

let cache: { cards: Card[]; fetchedAt: number } | null = null

async function fetchPage(offset: number): Promise<ApiPage> {
  const res = await fetch(`${API_URL}?offset=${offset}&limit=${PAGE_SIZE}`)
  if (!res.ok) throw new Error(`Card API responded with ${res.status}`)
  return res.json() as Promise<ApiPage>
}

export async function getCards(): Promise<Card[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.cards
  }

  const first = await fetchPage(0)
  let items: Card[] = first.items

  if (first.total > items.length) {
    const offsets: number[] = []
    for (let off = items.length; off < first.total; off += PAGE_SIZE) {
      offsets.push(off)
    }
    const pages = await Promise.all(offsets.map(fetchPage))
    for (const page of pages) items = items.concat(page.items)
  }

  cache = { cards: items, fetchedAt: Date.now() }
  console.log(`[cards] fetched ${items.length} cards from API`)
  return items
}
