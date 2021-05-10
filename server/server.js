const io = require('socket.io')();

const { sendCaptcha, stopSendingCaptcha, initGame, initPoison, randomFood, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');
const { makeid } = require('./utils');

const state = {};
const clientRooms = {};

const geckos = require('@geckos.io/server').default
// or with es6
// import geckos from '@geckos.io/server'

const io2 = geckos({
  cors: {
     origin: '*'
     },
 })

io2.listen(9208) // default port is 9208

io2.onConnection(channel => {
  console.log(`${channel.id} channelID`)
  channel.onDisconnect(() => {
    console.log(`${channel.id} got disconnected`)
  })

  channel.on('chat message', data => {
    console.log(`got ${data} from "chat message"`)
    // emit the "chat message" data to all channels in the same room
    io2.room(channel.roomId).emit('chat message', data)
  })

  channel.on('joinGame', data => {
    data.channelID = channel.id
    console.log(data.channelID, 'data.channelID')
    handleJoinGame(data)
  })
  channel.on('keydown', data => {
    handleKeydown(data, channel.id)
  });

  channel.on('newGame', data => {
    const channelID = channel.id
    channel.join(channelID)
    handleNewGame(channelID)
  });
  channel.on('recievedCaptcha', data => {
    handleRecievedCaptcha(data, channel.id)
  });
  channel.on('confirmedScore', data => {
    handleConfirmedScore(data)
  });

    function handleJoinGame(message) {
      console.log('handle join game')
      if (!state[message.roomName]) {
        initPoison(message.roomName);
        state[message.roomName] = initGame(message.roomName);
        // const room = io.sockets.adapter.rooms[message.roomName]
        // console.log('joined: ', message.screenSize, message.screenSize.width, message.screenSize.height)
        try {
          if (message.screenSize.width < 481) {
            console.log('setting grid to 20x20')
            state[message.roomName].gridX = 20
            state[message.roomName].gridY = 20
          }
          else {
            console.log('setting grid to 16x32')
            state[message.roomName].gridX = 32
            state[message.roomName].gridY = 16
          }
        }
        catch(error) {
          console.log('caught some shit in screen size')
          console.log(error)
        }
        randomFood(state[message.roomName])
        state[message.roomName].startTime = new Date()
        state[message.roomName].timer = new Date();
        state[message.roomName].timer.setMinutes( state[message.roomName].timer.getMinutes() + 1 );
        state[message.roomName].lastFood = new Date()
        // let allUsers;
        // if (room) {
        //   allUsers = room.sockets;
        // }
        //
        // let numClients = 0;
        // if (allUsers) {
        //   numClients = Object.keys(allUsers).length;
        // }
        //
        // if (numClients === 0) {
        //   channel.emit('unknownCode');
        //   return;
        // } else if (numClients > 1) {
        //   channel.emit('tooManyPlayers');
        //   return;
        // }
        state[message.roomName].clientID = message.channelID
        clientRooms[message.channelID] = message.roomName;
        console.log('sending start', clientRooms[message.channelID])
        io2.room(message.roomName).emit('init', 1)
        startGameInterval(message.roomName);
      }
    }

    function handleRecievedCaptcha(data, clientID) {
      let roomName = clientRooms[clientID]
      stopSendingCaptcha(roomName)
    }

    function handleConfirmedScore(data) {
      let roomName = data
      state[data].confirmed = true
    }

    function handleNewGame(clientID) {
      let roomName = makeid(10);
      clientRooms[clientID] = roomName;
      channel.emit('gameCode', roomName);
      // client.emit('gameCode', roomName);
      console.log(roomName, 'roomName')

      // client.join(roomName);
      // client.number = 2;
      // client.emit('init', 2);
      channel.emit('init', 2);
    }

    function handleKeydown(keyCode, clientID) {
      console.log('keystroke', clientID)
      const roomName = clientRooms[clientID];
      if (!roomName) {
        return;
      }
      try {
        keyCode = parseInt(keyCode);
      } catch(e) {
        console.error(e);
        return;
      }
      try {
        if(state[roomName]) {
          currentVelocity = state[roomName].players[0].vel
          const vel = getUpdatedVelocity(keyCode, currentVelocity, state[roomName]);

          if (vel) {
            try {
              state[roomName].players[0].vel = vel;
            }
            catch(error) {
              console.log('caught some shit trying to set velocity!')
              console.log(error)
            }
          }
        }
      }
      catch(error) {
        console.log('caught some shit getting velocity!')
        console.log(error)
      }

    }
})


io.on('connection', client => {

  client.on('keydown', handleKeydown);
  client.on('newGame', handleNewGame);
  client.on('recievedCaptcha', handleRecievedCaptcha);
  client.on('confirmedScore', handleConfirmedScore);
  // client.on('joinGame', handleJoinGame);

  // function handleJoinGame(message) {
  //   initPoison(message.roomName);
  //   state[message.roomName] = initGame(message.roomName);
  //   // const room = io.sockets.adapter.rooms[message.roomName]
  //   // console.log('joined: ', message.screenSize, message.screenSize.width, message.screenSize.height)
  //   try {
  //     if (message.screenSize.width < 481) {
  //       console.log('setting grid to 20x20')
  //       state[message.roomName].gridX = 20
  //       state[message.roomName].gridY = 20
  //     }
  //     else {
  //       console.log('setting grid to 16x32')
  //       state[message.roomName].gridX = 32
  //       state[message.roomName].gridY = 16
  //     }
  //   }
  //   catch(error) {
  //     console.log('caught some shit in screen size')
  //     console.log(error)
  //   }
  //   randomFood(state[message.roomName])
  //   state[message.roomName].startTime = new Date()
  //   state[message.roomName].timer = new Date();
  //   state[message.roomName].timer.setMinutes( state[message.roomName].timer.getMinutes() + 1 );
  //   state[message.roomName].lastFood = new Date()
  //   let allUsers;
  //   if (room) {
  //     allUsers = room.sockets;
  //   }
  //
  //   let numClients = 0;
  //   if (allUsers) {
  //     numClients = Object.keys(allUsers).length;
  //   }
  //
  //   if (numClients === 0) {
  //     client.emit('unknownCode');
  //     return;
  //   } else if (numClients > 1) {
  //     client.emit('tooManyPlayers');
  //     return;
  //   }
  //   clientRooms[client.id] = message.roomName;
  //   state[message.roomName].clientID = client.id
  //
  //   client.join(message.roomName);
  //   client.number = 1;
  //   client.emit('init', 1);
  //   startGameInterval(message.roomName);
  // }

  function handleRecievedCaptcha(data) {
    let roomName = clientRooms[client.id]
    stopSendingCaptcha(roomName)
  }

  function handleConfirmedScore(data) {
    let roomName = data
    state[data].confirmed = true
  }

  function handleNewGame() {
    let roomName = makeid(10);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);
    console.log(roomName)

    client.join(roomName);
    client.number = 2;
    client.emit('init', 2);
  }

  function handleKeydown(keyCode) {
    // console.log('keystroke', client.id)
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }
    try {
      if(state[roomName]) {
        currentVelocity = state[roomName].players[0].vel
        const vel = getUpdatedVelocity(keyCode, currentVelocity, state[roomName]);

        if (vel) {
          try {
            state[roomName].players[client.number - 1].vel = vel;
          }
          catch(error) {
            console.log('caught some shit trying to set velocity!')
            console.log(error)
          }
        }
      }
    }
    catch(error) {
      console.log('caught some shit getting velocity!')
      console.log(error)
    }

  }
})




function startGameInterval(roomName) {
  const intervalId = setInterval(() => {

    const winner = gameLoop(state[roomName]);
    const url = sendCaptcha(roomName)

    if (!winner) {
      try {
        // console.log('emitting game state')
        emitGameState(roomName, state[roomName])
        if (url) {
          // console.log('theres a captcha')
          emitCaptcha(roomName, url)
        }
      }
      catch(error) {
        console.log(error)
      }
    } else {
      emitGameOver(roomName, winner);
      state[roomName].endTime = new Date()
      state[roomName] = null;
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  const player = gameState.players[0]
  const food = gameState.food
  const grid = {
    x: gameState.gridX,
    y: gameState.gridY
  }
  const lengthOfSnake = player.snake.length
  var bufArr = new ArrayBuffer(11+(lengthOfSnake * 2))
  // var bufView = new Uint8Array(bufArr)
  var bufView = []
  bufView[0]=player.pos.x
  bufView[1]=player.pos.y
  bufView[2]=food[0].x
  bufView[3]=food[0].y
  bufView[4]=food[1].x
  bufView[5]=food[1].y
  bufView[6]= food[0].index
  bufView[7]= food[1].index
  bufView[8]=grid.x
  bufView[9]=grid.y
  bufView[10]=gameState.currentTime
  for (let x = 0; x < (lengthOfSnake); x++) {
    let index = 11 + (x * 2)
    bufView[index]=player.snake[x].x
    bufView[index+1]=player.snake[x].y
  }
  // console.log(bufView)
  // console.log(bufView)
  // io.sockets.in(room)
  //   // .emit('gameState', JSON.stringify(gameState))
  //   .emit('gameState', bufArr)
  // console.log('emitting game state', io2.room(gameState.clientID), gameState.clientID)
  io2.room(gameState.clientID).emit('gameState', bufView)
}

function emitCaptcha(room, url) {
  // Send this event to everyone in the room.
  console.log('emitting captcha', url)
  console.log(state[room].clientID)
  io2.room(state[room].clientID).emit('captcha', url)
  // io.sockets.in(room)
  //   .emit('captcha', url);
}

function emitGameOver(room, winner) {
  try {
    const scoreMessage = {
      score: state[room].foodTimes.length,
      gameCode: room
    }

    io2.room(state[room].clientID).emit('sendScore', scoreMessage)

    io.sockets.in(room)
      .emit('sendScore', scoreMessage);




  } catch(error) {
    console.log('caught error in scoreMessage')
    console.log(error)
  }

  // io.sockets.in(room)
  //   .emit('gameOver', JSON.stringify({ winner }));
}

io.listen(process.env.PORT || 3000);
