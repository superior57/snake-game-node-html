const BG_COLOUR = '#231f20';
const SNAKE_COLOUR = '#ffffff';
const FOOD_COLOUR = '#e66916';

let isPlaying = false
const socket = io('http://3.139.87.87:3000');
const socketPractice = io('http://3.133.132.75:3000');

// or add a minified version to your index.html file
// https://github.com/geckosio/geckos.io/tree/master/bundles

const channel = geckos({
  // // url: 'http://localhost',
  url: 'http://3.133.132.75',
  port: 9208
})

const channel2 = geckos({
  // // url: 'http://localhost',
  url: 'http://3.139.87.87',
  port: 9208
})


console.log('testing')
channel.onConnect(error => {
  console.log('connected')
  if (error) {
    console.error(error.message)
    return
  }

  channel.on('chat message', data => {
    console.log(`You got the message ${data}`)
  })

  channel.on('init', data => {
    handleInit(data)
  });

  channel.on('gameState', data => {
    // console.log(data, 'gameState')
    handleGameState(data)
  });
  channel.on('gameCode', data => {
    handlePracticeCode(data)
  });
  channel.on('captcha', data => {
    console.log('recieved captcha')
    handleCaptcha(data)
  });
  channel.on('sendScore', data => {
    handleScore(data)
  });
  channel.emit('chat message', 'a short message sent to the server')
})

channel2.onConnect(error => {
  console.log('connected')
  if (error) {
    console.error(error.message)
    return
  }

  channel2.on('chat message', data => {
    console.log(`You got the message ${data}`)
  })

  channel2.on('init', data => {
    handleInit(data)
  });

  channel2.on('gameState', data => {
    // console.log(data, 'gameState')
    handleGameState(data)
  });
  channel2.on('gameCode', data => {
    handlePracticeCode(data)
  });
  channel2.on('captcha', data => {
    console.log('recieved captcha')
    handleCaptcha(data)
  });
  channel2.on('sendScore', data => {
    handleScore(data)
  });
  channel2.emit('chat message', 'a short message sent to the server')
})
// For Development
// const socket = io('http://localhost:3000');
// const socketPractice = io('http://localhost:3000');
// const channel = geckos({
//   url: 'http://127.0.0.1',
//   port: 9208
// })

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('sendScore', handleScore);
socket.on('captcha', handleCaptcha);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);

socketPractice.on('init', handleInit);
socketPractice.on('gameState', handleGameState);
socketPractice.on('gameOver', handleGameOver);
socketPractice.on('gameCode', handlePracticeCode);
socketPractice.on('captcha', handleCaptcha);
socketPractice.on('unknownCode', handleUnknownCode);
socketPractice.on('sendScore', handleScore);
socketPractice.on('tooManyPlayers', handleTooManyPlayers);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const countdownScreen = document.getElementById('countdownScreen');
const countdown = document.getElementById('countdown');
const scoreScreen = document.getElementById('scoreScreen');
const scoreDisplay = document.getElementById('scoreDisplay');
const newGameBtn = document.getElementById('newGameButton');
let gcanvas = document.getElementById('gameCanvas');
const joinGameBtn = document.getElementById('joinGameButton');
const practiceBtn = document.getElementById('practiceButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const time = document.getElementById('time');
var isPractice = false
const img = document.getElementById('colorImage');
const toolbar = document.getElementById('toolbar')
let ctx3
scoreScreen.style.display = "none";
joinGameBtn.addEventListener('click', joinGame);

var mc = new Hammer(gameScreen);

mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

mc.on("swipeleft", function() {
  // console.log('left')
  if (isPractice) {
    socketPractice.emit('keydown', 65);
  } else {
    socket.emit('keydown', 65);
  }
});

mc.on("swiperight", function() {
  // console.log('right')
  if (isPractice) {
    socketPractice.emit('keydown', 68);
  } else {
    socket.emit('keydown', 68);
  }
});

mc.on("swipedown", function() {
  // console.log('down')
  if (isPractice) {
    socketPractice.emit('keydown', 83);
  } else {
    socket.emit('keydown', 83);
  }
});

mc.on("swipeup", function() {
  // console.log('up')
  if (isPractice) {
    socketPractice.emit('keydown', 87);
  } else {
    socket.emit('keydown', 87);
  }
});

const url = new URLSearchParams(window.location.search);
const code = url.get('gameCode')
if (!isPlaying) {
  if (code) {
    // console.log('joining game')
    joinGame()
    isPlaying = true
  }
}

function joinPractice(gameCode) {
  initialScreen.style.display = "none";
  countdownScreen.style.display = "none";
  gameScreen.style.display = "block";
  gcanvas = document.getElementById('gameCanvas');
  const windowHeight = $('body').innerHeight()
  const windowWidth = $('body').innerWidth()
  if (windowWidth < 481) {
    gcanvas.height = windowHeight * (5/6)
    gcanvas.width = windowWidth
  }
  else {
    gcanvas.height = windowHeight * (8/9)
    gcanvas.width = windowWidth
  }
  // console.log('height: ', gcanvas.height)
  // console.log('width: ', gcanvas.width)
  const message = {
    roomName: gameCode,
    screenSize: {
      width: gcanvas.width,
      height: gcanvas.height
    }
  }
  // console.log(message.screenSize)
  if (!isPlaying) {
    channel.emit('joinGame', message)
    isPlaying = true
  }
  // socketPractice.emit('joinGame', message);
  init();
}
let playerNumber;
let gameActive = false;

function newGame() {
  console.log("newGame")
  channel2.emit('newGame')
  // socket.emit('newGame');
}

function newPractice() {
  console.log("newGame")
  channel.emit('newGame')
  // socketPractice.emit('newGame');
}

function joinGame() {
  if (!isPlaying) {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('gameCode')
    if (!code) {
      isPractice = true
      newPractice()
    } else {
      initialScreen.style.display = "none";
      console.log('setting countdown')
      countdownScreen.style.display = "block";
      var timeleft = 3;
      var downloadTimer = setInterval(function(){
        if(timeleft <= 0){
          console.log('starting game')
          initialScreen.style.display = "none";
          countdownScreen.style.display = "none";
          gameScreen.style.display = "block";
          gcanvas = document.getElementById('gameCanvas');
          const windowHeight = $('body').innerHeight()
          const windowWidth = $('body').innerWidth()
          if (windowWidth < 481) {
            gcanvas.height = windowHeight * (5/6)
            gcanvas.width = windowWidth
          }
          else {
            gcanvas.height = windowHeight * (8/9)
            gcanvas.width = windowWidth
          }
          const message = {
            roomName: code,
            screenSize: {
              width: gcanvas.width,
              height: gcanvas.height
            }
          }
          if (!isPlaying) {
            channel2.emit('joinGame', message)
            isPlaying = true
          }
          init()
          clearInterval(downloadTimer);
        } else {
          countdown.innerHTML = timeleft
        }
        timeleft -= 1;
      }, 1000)
    }
  }
}

function init() {
  initialScreen.style.display = "none";
  countdownScreen.style.display = "none";
  gameScreen.style.display = "block";
  ctx3 = gcanvas.getContext('2d');
  document.addEventListener('keydown', keydown);
  gameActive = true;
}

function keydown(e) {
  // console.log(e.keyCode)
  if (isPractice) {
    channel.emit('keydown', e.keyCode);
  } else {
    channel2.emit('keydown', e.keyCode);
  }
}

function paintGame(state) {
  time.innerText = state.currentTime;

  ctx3.clearRect(0, 0, gcanvas.width, gcanvas.height);

  if (state.food){
    let food = state.food
    let sizeX = null
    let sizeY = null
    if (gcanvas.width < 481) {
      // console.log('grid', state.gridX, state.gridY)
      sizeX = gcanvas.width/(state.gridX)
      sizeY = gcanvas.height/(state.gridY)
      ctx3.fillStyle = 'rgba(0,0,0,0)'
      ctx3.fillRect(0, 0, (sizeX*state.gridX), (sizeY*state.gridY))
    }
    else {
      // console.log('grid', state.gridX, state.gridY)
      sizeX = gcanvas.width/(state.gridX)
      sizeY = gcanvas.height/(state.gridY)
      ctx3.fillStyle = 'rgba(0,0,0,0)'
      ctx3.fillRect(0, 0, (sizeX*state.gridX), (sizeY*state.gridY))
    }
    let color1 = null
    let color2 = null
    switch(state.food[0].index) {
      case 0:
        color1 = '#00ff00'
        break;
      case 1:
        color1 = '#ff0000'
        break;
      case 2:
        color1 = '#0000ff'
        break;
      case 3:
        color1 = '#d97012'
        break;
      case 4:
        color1 = '#c41acb'
        break;
      case 5:
        color1 = '#ffff00'
        break;
    }
    switch(state.food[1].index) {
      case 0:
        color2 = '#00ff00'
        break;
      case 1:
        color2 = '#ff0000'
        break;
      case 2:
        color2 = '#0000ff'
        break;
      case 3:
        color2 = '#d97012'
        break;
      case 4:
        color2 = '#c41acb'
        break;
      case 5:
        color2 = '#ffff00'
        break;
    }

    ctx3.fillStyle = color1
    // ctx3.fillStyle = state.food[0].color.hex
    ctx3.fillRect(food[0].x * sizeX, food[0].y * sizeY, sizeX, sizeY);

    ctx3.fillStyle = color2
    // ctx3.fillStyle = state.food[1].color.hex
    ctx3.fillRect(food[1].x * sizeX, food[1].y * sizeY, sizeX, sizeY);

    paintPlayer(state.players[0], sizeX, sizeY, SNAKE_COLOUR);
    paintPlayer(state.players[1], sizeX, sizeY, 'red');
  }
}

function paintPlayer(playerState, sizeX, sizeY, colour) {
  const snake = playerState.snake;

  ctx3.fillStyle = colour;
  for (let cell of snake) {
    ctx3.fillRect(cell.x * sizeX, cell.y * sizeY, sizeX, sizeY)
  }
}

function handleInit(number) {
  playerNumber = 1;
}

function handleCaptcha(url) {
  console.log('recieved', url)
  img.src=url;
  if (isPractice) {
    channel.emit('recievedCaptcha')
  }
  else {
    channel2.emit('recievedCaptcha')
  }
}

function handleGameState(gameState) {
  // console.log('handling game state', gameState)
  if (!gameActive) {
    return;
  }

  var bufView = new Uint8Array(gameState);
    // console.log(gameState)
  state = {
    players: [
      {
        pos: {
          x: bufView[0],
          y: bufView[1],
        },
        snake: [
        ],
      },
      {
        pos: {
          x: 0,
          y: 0,
        },
        vel: {
          x: 0,
          y: 0,
        },
        snake: [],
      }
    ],
    food: [{
      x: bufView[2],
      y: bufView[3],
      index: bufView[6]
    },
    {
      x: bufView[4],
      y: bufView[5],
      index: bufView[7]
    }],
    gridX: bufView[8],
    gridY: bufView[9],
    currentTime:bufView[10]
  }
  for (x = 0; x < (bufView.length-11)/2; x++){
    let index = 11 + (x * 2)
    let pos = {
      x: bufView[index],
      y: bufView[index+1]
    }
    state.players[0].snake.push(pos)
  }
  requestAnimationFrame(() => paintGame(state));
  // gameState = JSON.parse(gameState)
  // requestAnimationFrame(() => paintGame(gameState))
}

function handleGameOver(data) {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  gameActive = false;

  if (data.winner === playerNumber) {
    alert('You died!')
    console.log('You died!');
  } else {
    alert('You died!')
    console.log('You died!');
  }
  isPractice = false
}

function handleScore(data) {
  scoreDisplay.innerText = data.score;
  gameScreen.style.display = "none";
  scoreScreen.style.display = "block";
  console.log(data.score)
}

function handlePracticeCode(gameCode) {
  joinPractice(gameCode)
}

function handleGameCode(gameCode) {
  console.log(gameCode)
}

function handleUnknownCode() {
  reset();
  alert('Unknown Game Code')
}

function handleTooManyPlayers() {
  reset();
  alert('This game is already in progress');
}

function reset() {
  playerNumber = null;
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
  isPractice = false
}
