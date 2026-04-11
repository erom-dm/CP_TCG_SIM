import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import type { ClientMessage, ServerMessage } from 'shared'
import { GameRoom } from './GameRoom.js'

const PORT = Number(process.env.PORT ?? 3001)

const httpServer = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Game server running\n')
})

const wss = new WebSocketServer({ server: httpServer })

// Active rooms — cleaned up when they become empty
const rooms = new Map<string, GameRoom>()

function findOrCreateRoom(): GameRoom {
  for (const room of rooms.values()) {
    if (!room.isFull()) return room
  }
  const room = new GameRoom()
  rooms.set(room.id, room)
  return room
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

    if (msg.type === 'join') {
      const room = findOrCreateRoom()
      const player = room.addPlayer(ws, msg.name.trim() || 'Anonymous')
      playerId = player.id
      currentRoom = room

      const ack: ServerMessage = { type: 'joined', player, roomId: room.id }
      ws.send(JSON.stringify(ack))
      room.broadcastState()

      console.log(`[room ${room.id.slice(0, 8)}] ${player.name} joined (seat ${player.index})`)
    } else if (msg.type === 'action' && currentRoom && playerId) {
      currentRoom.handleAction(playerId, msg.payload)
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
})
