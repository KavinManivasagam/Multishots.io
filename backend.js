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

const SPEED = 10

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

//for smooth frame animation, standard animation level
setInterval(() => {
  io.emit('updatePlayers', backEndPlayers)
}, 15)

//listen for app starting
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
console.log('server did load')