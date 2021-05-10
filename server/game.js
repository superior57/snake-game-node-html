const { IMAGES, COLORS, GRID_SIZE } = require('./constants');
let poisonFood = null
let atePoison = false
const poison = {};

module.exports = {
  initGame,
  initPoison,
  sendCaptcha,
  stopSendingCaptcha,
  gameLoop,
  getUpdatedVelocity,
  randomFood
}

function initGame(roomName) {
  const state = createGameState(roomName)
  randomFood(state);
  return state;
}

function initPoison(roomName) {
  poison[roomName] = {
    number: null,
    url: null,
    needToSend: false
  }
}

function sendCaptcha(roomName) {
  if (poison[roomName].needToSend){
    return poison[roomName].url
  }
  else {
    return null
  }
}

function stopSendingCaptcha(roomName) {
  try {
    poison[roomName].needToSend = false
  }
  catch {
    console.log('no poison yet')
  }
}

function createGameState(roomName) {
  return {
    clientID: null,
    confirmed: false,
    roomName: roomName,
    startTime: null,
    currentTime: null,
    endTime: null,
    foodTimes: [],
    lastFood: null,
    sinceLastFood: null,
    players: [
      {
        pos: {
          x: 3,
          y: 2,
        },
        vel: {
          x: 1,
          y: 0,
        },
        snake: [
          {x: 1, y: 2},
          {x: 2, y: 2},
          {x: 3, y: 2},
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
        snake: [
          // {x: 20, y: 10},
          // {x: 19, y: 10},
          // {x: 18, y: 10},
        ],
      }
    ],
    food: [{}],
    gridsize: GRID_SIZE,
    gridX: 0,
    gridY: 0
  };
}

function gameLoop(state) {
  if (!state) {
    return;
  }
  if (state.timer < new Date()) {
    return 2;
  }
  if(state.lastFood) {
    state.sinceLastFood = new Date().getTime() - state.lastFood.getTime()
  }
  if (state.timer) {
    state.currentTime = state.timer.getTime() - new Date().getTime()
    state.currentTime = Math.floor(state.currentTime/1000)
  }
  const playerOne = state.players[0];
  const playerTwo = state.players[1];
  gridWidth = state.gridX
  gridHeight = state.gridY
  playerOne.pos.x += playerOne.vel.x;
  playerOne.pos.y += playerOne.vel.y;

  if (playerOne.pos.x < 0 || playerOne.pos.x > (gridWidth - 1) || playerOne.pos.y < 0 || playerOne.pos.y > (gridHeight - 1)) {
    console.log('player outside')
    return 2;
  }

  if (state.food[0].x === playerOne.pos.x && state.food[0].y === playerOne.pos.y) {
    if(checkIfPoison(state, 0)) {
      return 2
    }
  }

  if (state.food[1].x === playerOne.pos.x && state.food[1].y === playerOne.pos.y) {
    if(checkIfPoison(state, 1)) {
      return 2
    }
  }

  if (playerOne.vel.x || playerOne.vel.y) {
    for (let cell of playerOne.snake) {
      if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
        return 2;
      }
    }

    playerOne.snake.push({ ...playerOne.pos });
    playerOne.snake.shift();
  }

  if (playerTwo.vel.x || playerTwo.vel.y) {
    for (let cell of playerTwo.snake) {
      if (cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
        return 1;
      }
    }

    playerTwo.snake.push({ ...playerTwo.pos });
    playerTwo.snake.shift();
  }

  return false;
}

function checkIfPoison(state, foodNumber) {
  if (foodNumber === poison[state.roomName].number) {
    return true;
  } else {
    const playerOne = state.players[0];
    playerOne.snake.push({ ...playerOne.pos });
    playerOne.pos.x += playerOne.vel.x;
    playerOne.pos.y += playerOne.vel.y;
    state.lastFood = new Date()
    state.foodTimes.push(state.lastFood.getTime() - state.startTime.getTime())
    randomFood(state);
  }
}

function randomFood(state) {
  gridWidth = state.gridX - 2
  gridHeight = state.gridY - 2
  const food = [
    {
      x: Math.floor(Math.random() * gridWidth + 1),
      y: Math.floor(Math.random() * gridHeight + 1),
      color: {},
      index: null
    },
    {
      x: Math.floor(Math.random() * gridWidth + 1),
      y: Math.floor(Math.random() * gridHeight + 1),
      color: {},
      index: null
    }
  ]

  if (food[0].x === food[1].x && food[0].y === food[1].y) {
    return randomFood(state);
  }

  for (let i = 0; i < 4; i++) {
    let nextBlock = { x: null, y: null }
    nextBlock.x = state.players[0].pos.x + (state.players[0].vel.x * i)
    nextBlock.y = state.players[0].pos.y + (state.players[0].vel.y * i)
    console.log('next block', nextBlock)
    if (nextBlock.x === food[0].x && nextBlock.y === food[0].y){
      return randomFood(state);
    }
    if (nextBlock.x === food[1].x && nextBlock.y === food[1].y){
      return randomFood(state);
    }
  }

  for (let cell of state.players[0].snake) {
    if (cell.x === food[0].x && cell.y === food[0].y) {
      return randomFood(state);
    }
  }

  for (let cell of state.players[0].snake) {
    if (cell.x === food[1].x && cell.y === food[1].y) {
      return randomFood(state);
    }
  }

  state.food = food;
  state.sinceLastFood = 0;
  randomColors(state)
}

function randomColors(state) {
  let firstNumber = Math.floor(Math.random() * COLORS.length)
  let secondNumber = Math.floor(Math.random() * COLORS.length)
  if (firstNumber == secondNumber) {
    randomColors(state)
  } else {
    state.food[0].color = COLORS[firstNumber]
    state.food[0].index = firstNumber
    state.food[1].color = COLORS[secondNumber]
    state.food[1].index = secondNumber
    randomPoison(state);
  }
}

function randomPoison(state) {
  poison[state.roomName].number = Math.round(Math.random())
  poisonColor = state.food[poison[state.roomName].number].color.name
  let array = IMAGES.filter(image => image.color == poisonColor)
  let rand = Math.floor(Math.random() * array[0].imgURLs.length)
  poison[state.roomName].url = array[0].imgURLs[rand]
  poison[state.roomName].needToSend = true
  state.imgURL = array[0].imgURLs[rand]
}

function getUpdatedVelocity(keyCode, currentVelocity, state) {
  console.log(keyCode)
  let player = state.players[0]
  switch (keyCode) {
    case 37: { // left
      let move = { x: -1, y: 0 }
      let newBlock = {}
      newBlock.x = player.pos.x + move.x
      newBlock.y = player.pos.y + move.y
      if (newBlock.x === player.snake[player.snake.length - 2].x && newBlock.y === player.snake[player.snake.length - 2].y) {
        return null
      } else {
        if (currentVelocity.x != 1) {
          return { x: -1, y: 0 };
        }
        else {
          return null
        }
      }
    }
    case 38: { // down
      let move = { x: 0, y: -1 }
      let newBlock = {}
      newBlock.x = player.pos.x + move.x
      newBlock.y = player.pos.y + move.y
      if (newBlock.x === player.snake[player.snake.length - 2].x && newBlock.y === player.snake[player.snake.length - 2].y) {
        return null
      } else {
        if (currentVelocity.y != 1) {
          return { x: 0, y: -1 };
        }
        else {
          return null
        }
      }
    }
    case 39: { // right
      let move = { x: 1, y: 0 }
      let newBlock = {}
      newBlock.x = player.pos.x + move.x
      newBlock.y = player.pos.y + move.y
      if (newBlock.x === player.snake[player.snake.length - 2].x && newBlock.y === player.snake[player.snake.length - 2].y) {
        return null
      } else {
        if (currentVelocity.x != -1) {
          return { x: 1, y: 0 };
        }
        else {
          return null
        }
      }
    }
    case 40: { // up
      let move = { x: 0, y: 1 }
      let newBlock = {}
      newBlock.x = player.pos.x + move.x
      newBlock.y = player.pos.y + move.y
      if (newBlock.x === player.snake[player.snake.length - 2].x && newBlock.y === player.snake[player.snake.length - 2].y) {
        return null
      } else {
        if (currentVelocity.y != -1) {
          return { x: 0, y: 1 };
        }
        else {
          return null
        }
      }
    }
    case 65: { // left
      let move = { x: -1, y: 0 }
      let newBlock = {}
      newBlock.x = player.pos.x + move.x
      newBlock.y = player.pos.y + move.y
      if (newBlock.x === player.snake[player.snake.length - 2].x && newBlock.y === player.snake[player.snake.length - 2].y) {
        // console.log('moving backwards')
        return null
      } else {
        if (currentVelocity.x != 1) {
          // console.log('inside')
          return { x: -1, y: 0 };
        }
        else {
          // console.log('nothing')
          return null
        }
      }
    }
    case 87: { // down
      let move = { x: 0, y: -1 }
      let newBlock = {}
      newBlock.x = player.pos.x + move.x
      newBlock.y = player.pos.y + move.y
      if (newBlock.x === player.snake[player.snake.length - 2].x && newBlock.y === player.snake[player.snake.length - 2].y) {
        return null
      } else {
        if (currentVelocity.y != 1) {
          return { x: 0, y: -1 };
        }
        else {
          return null
        }
      }
    }
    case 68: { // right
      let move = { x: 1, y: 0 }
      let newBlock = {}
      newBlock.x = player.pos.x + move.x
      newBlock.y = player.pos.y + move.y
      if (newBlock.x === player.snake[player.snake.length - 2].x && newBlock.y === player.snake[player.snake.length - 2].y) {
        return null
      } else {
        if (currentVelocity.x != -1) {
          return { x: 1, y: 0 };
        }
        else {
          return null
        }
      }
    }
    case 83: { // up
      let move = { x: 0, y: 1 }
      let newBlock = {}
      newBlock.x = player.pos.x + move.x
      newBlock.y = player.pos.y + move.y
      if (newBlock.x === player.snake[player.snake.length - 2].x && newBlock.y === player.snake[player.snake.length - 2].y) {
        return null
      } else {
        if (currentVelocity.y != -1) {
          return { x: 0, y: 1 };
        }
        else {
          return null
        }
      }
    }
  }
}
