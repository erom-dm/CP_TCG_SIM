import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import type { ClientMessage, ServerMessage } from 'shared'
import { GameRoom } from './GameRoom.js'
import { cards } from './cards/registry.js'

const PORT = Number(process.env.PORT ?? 3001)
const NAME_MIN_LENGTH = 4

// ---------------------------------------------------------------------------
// HTTP server — serves the REST API alongside the WS upgrade
// ---------------------------------------------------------------------------

const httpServer = http.createServer((req, res) => {
  // GET /api/cards — full card pool for the client card browser
  if (req.method === 'GET' && req.url === '/api/cards') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(JSON.stringify({ cards }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Game server running\n')
})

// ---------------------------------------------------------------------------
// WebSocket server
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ server: httpServer })

// Active rooms — cleaned up when they become empty
const rooms = new Map<string, GameRoom>()

function send(ws: WebSocket, msg: ServerMessage): void {
  ws.send(JSON.stringify(msg))
}

function validateName(raw: string): string | null {
  const name = raw.trim()
  return name.length >= NAME_MIN_LENGTH ? name : null
}

wss.on('connection', (ws: WebSocket) => {
  let playerId: string | null = null
  let currentRoom: GameRoom | null = null

  ws.on('message', (raw) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage
    } catch {
      return
    }

    switch (msg.type) {
      case 'create': {
        const name = validateName(msg.name)
        if (!name) {
          send(ws, { type: 'error', message: `Name must be at least ${NAME_MIN_LENGTH} characters.` })
          return
        }

        const room = new GameRoom()
        rooms.set(room.id, room)

        const player = room.addPlayer(ws, name)
        playerId = player.id
        currentRoom = room

        send(ws, { type: 'joined', player, roomId: room.id })
        room.broadcastState()

        console.log(`[room ${room.id.slice(0, 8)}] created by ${name}`)
        break
      }

      case 'join': {
        const name = validateName(msg.name)
        if (!name) {
          send(ws, { type: 'error', message: `Name must be at least ${NAME_MIN_LENGTH} characters.` })
          return
        }

        const room = rooms.get(msg.roomId)
        if (!room) {
          send(ws, { type: 'error', message: 'Room not found.' })
          return
        }
        if (room.isFull()) {
          send(ws, { type: 'error', message: 'Room is full.' })
          return
        }

        const player = room.addPlayer(ws, name)
        playerId = player.id
        currentRoom = room

        send(ws, { type: 'joined', player, roomId: room.id })
        room.broadcastState()

        console.log(`[room ${room.id.slice(0, 8)}] ${name} joined (seat ${player.index})`)
        break
      }

      case 'select_deck': {
        if (!currentRoom || !playerId) {
          send(ws, { type: 'error', message: 'Not in a room.' })
          return
        }
        currentRoom.selectDeck(playerId, msg.deck)
        break
      }

      case 'action': {
        if (currentRoom && playerId) currentRoom.handleAction(playerId, msg.payload)
        break
      }
    }
  })

  ws.on('close', () => {
    if (!currentRoom || !playerId) return
    const roomId = currentRoom.id
    currentRoom.removePlayer(playerId)

    if (currentRoom.isEmpty()) {
      rooms.delete(roomId)
      console.log(`[room ${roomId.slice(0, 8)}] closed (empty)`)
    } else {
      currentRoom.broadcastState()
    }
  })

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Game server listening on ws://localhost:${PORT}`)
  console.log(`Card pool API at http://localhost:${PORT}/api/cards`)
})
