const express = require('express')
const app = express()
// socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })
const port = 3000
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

//to hold all backend players
const backEndPlayers = {}
const backEndProjectiles = {}

const SPEED = 10
const RADIUS = 10; 
const PROJECTILE_RADIUS = 5; 
let projectileId = 0 

// Listen for a new connection event from any client.
io.on('connection', (socket) => {
  console.log('a user connected');

  
  backEndPlayers[socket.id] = {
    // Set the player's initial x-coordinate to a random value within a range (here assumed to be 0 to 500).
    x: 500 * Math.random(),

    // Set the player's initial y-coordinate to a random value within a range (here assumed to be 0 to 500).
    y: 500 * Math.random(),
    
    color: `hsl(${360 * Math.random()}, 100%, 50%)`,
    // Initialize a sequence number for the player, starting at 0.
    // This could be used for various purposes like tracking messages or actions.
    sequenceNumber: 0
  }

  // Emit 'updatePlayers' event to all connected clients, sending the current state of all players.

  io.emit('updatePlayers', backEndPlayers)

  socket.on('initCanvas', ({width, height, devicePixelRatio}) => {
    backEndPlayers[socket.id].canvas = {
      width, 
      height,
    }
    backEndPlayers[socket.id].radius = RADIUS
    if(devicePixelRatio > 1){
      backEndPlayers[socket.id].radius = 2*RADIUS
    }
  })

  socket.on('shoot', ({ x, y, angle }) => {
    projectileId++

    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    backEndProjectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id
    }

    console.log(backEndProjectiles)
  })
  // Listen for a disconnect event from any of the clients.
  socket.on('disconnect', (reason) => {
    console.log(reason)
    // Remove the disconnected player from the backEndPlayers object.

    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('keydown', ({ keycode, sequenceNumber }) => {
    backEndPlayers[socket.id].sequenceNumber = sequenceNumber
    switch (keycode) {
      case 'KeyW':
        backEndPlayers[socket.id].y -= SPEED
        break

      case 'KeyA':
        backEndPlayers[socket.id].x -= SPEED
        break

      case 'KeyS':
        backEndPlayers[socket.id].y += SPEED
        break

      case 'KeyD':
        backEndPlayers[socket.id].x += SPEED
        break
    }
  })

  console.log(backEndPlayers)
})

//for smooth frame animation, standard animation level, backend ticker
setInterval(() => {

  //update projectile positions 
  for (const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    const PROJECTILE_RADIUS = 5
    if(backEndProjectiles[id].x - PROJECTILE_RADIUS >= backEndPlayers[backEndProjectiles[id].playerId]?.canvas.width || 
      backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 || 
      backEndProjectiles[id].y - PROJECTILE_RADIUS >= backEndPlayers[backEndProjectiles[id].playerId]?.canvas.height ||
      backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0 ){
      delete backEndProjectiles[id]
      continue; 
    }
    for(const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId]

      const DISTANCE = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x , 
        backEndProjectiles[id].y - backEndPlayer.y)

        if(DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius && backEndProjectiles[id].playerId !== playerId) {
          delete backEndProjectiles[id]
          delete backEndPlayers[playerId]
          break
        }

        console.log(DISTANCE)
    }

  }
  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers)
}, 15)

//listen for app starting
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
console.log('server did load')