#!/usr/bin/env node

/*
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * 2015 Øyvind Berntsen
 * Title: Bookworm
 *
 * A Snake clone for my bookshelf, with a nice hidden
 * surprise for my girlfriend ;).
 */

// Requirements
const OPC = new require('./opc.js');
const keypress = new require('keypress');
keypress(process.stdin);
const fs = new require('fs');
const joystick = new (require('joystick'))(0, 3500, 350);

// Prototype functions
function equals(array1, array2) {
  if (!array1 || !array2) {
    return false;
  }

  // compare lengths, save time
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0, l = array1.length; i < l; i += 1) {
    // Nested arrays?
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      if (!array1[i].equals(array2[i])) {
        return false;
      }
    } else if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

// Connect OPC
const client = new OPC('localhost', 7890);

// Starting variables
let lastKey;
let grow = false;

const gridSize = [14, 36]; // width, height i.e. total pixels 14*36 = 504
const bottomRow = [];
const topRow = [];
for (let i = 0; i < gridSize[0]; i += 1) {
  // One pixel in the bottom and top rows
  bottomRow.push(i * gridSize[1]);
  topRow.push((i * gridSize[1]) + (gridSize[1] - 1));
}

const winCondition = 35;
let winner;

const blinkSpeed = 5000;
const picture = JSON.parse(fs.readFileSync('/home/omb/bookshelf/drawings/ring.json', 'utf8'));
for (let l = 0; l < picture.length; l += 1) {
  // Quirk; need to set the blink time for each blinking point
  if (picture[l].blink) {
    picture[l].blink = new Date();
  }
}

// Definition of snake sprite
let snake = {
  // Start snake in lower right, upward moving, green
  body: [{
    point: [12, 13, 14, 15],
    dir: 'up',
    color: [0, 255, 0]
  }, {
    point: [8, 9, 10, 11],
    dir: 'up',
    color: [0, 255, 0]
  }, {
    point: [4, 5, 6, 7],
    dir: 'up',
    color: [0, 255, 0]
  }, {
    point: [0, 1, 2, 3],
    dir: 'up',
    color: [0, 255, 0]
  }],
  speed: 400,
  lastMove: new Date()
};

// Definition of fruit sprite
const fruit = {
  point: [268, 269, 270, 271], // First fruit is about mid-screen
  color: [255, 0, 0], // First fruit is red
  colors: [
      [255, 0, 0],
      [255, 0, 255],
      [0, 255, 255],
      [0, 0, 255]
  ] // These colors appear most distinctly
};

// Define turns
const turns = [];

function registerTurn(dir) {
  // Ignore opposite direction
  if (lastKey === 'up' && dir === 'down') {
    return false;
  }
  if (lastKey === 'down' && dir === 'up') {
    return false;
  }
  if (lastKey === 'left' && dir === 'right') {
    return false;
  }
  if (lastKey === 'right' && dir === 'left') {
    return false;
  }

  // Register turn
  const point = snake.body[0].point.slice();
  for (let i = 0; i < turns.length; i += 1) {
    if (equals(turns[i].point, point)) {
      return false;
    }
  }

  // TODO Depending on current counter, register next turn? Smoother gameplay?
  turns.unshift({
    point,
    dir
  });

  return true;
}

// Standard input
process.stdin.setRawMode(true);
process.stdin.on('keypress', (chunk, key) => {
  if (key && key.ctrl && key.name === 'c') process.exit();

  // Change direction if direction key pressed
  if (['up', 'down', 'left', 'right'].indexOf(key.name) !== -1) {
    if (lastKey !== key.name) {
      if (registerTurn(key.name)) {
        lastKey = key.name;
      }
    }
  }
});

// Joystick input
const joyMapping = {
  3: 'up',
  0: 'down',
  2: 'left',
  1: 'right',
  13: 'up',
  14: 'down',
  11: 'left',
  12: 'right'
};

joystick.on('button', (input) => {
  // Only respond to keydown, and ignore other buttons than those mapped.
  const key = joyMapping[input.number];
  if (input.value && key) {
    registerTurn(key);
  }
});

function testCrossVertical() {
  let i;
  let l;
  const body = snake.body;
  for (i = 0; i < body.length; i += 1) {
    if (bottomRow.indexOf(body[i].point[0]) !== -1 && body[i].dir === 'up') {
      // Top to bottom transition, continue snake on same column
      for (l = 0; l < body[i].point.length; l += 1) {
        body[i].point[l] -= gridSize[1];
      }
      return;
    } else if (topRow.indexOf(body[i].point[3]) !== -1 && body[i].dir === 'down') {
      // Bottom to top transition, continue snake on same column
      for (l = 0; l < body[i].point.length; l += 1) {
        body[i].point[l] += gridSize[1];
      }
      return;
    } else if (body[i].point[0] === gridSize[0] * gridSize[1]) {
      // Corner case, literally
      body[i].point = [0, 1, 2, 3];
    }
  }
}

function randomSquare() {
  const high = 9 * 14; // Number of squares
  const low = 0;
  let start = Math.floor((Math.random() * ((high - low) + 1)) + low);
  if (start > 0) {
    start *= 4; // Since there are actually four pixels per square
  }
  return [start, start + 1, start + 2, start + 3];
}

function pointInSnakeBody(point) {
  for (let i = 0; i < snake.body.length; i += 1) {
    if (equals(snake.body[i].point, point)) {
      return true;
    }
  }
  return false;
}

function moveFruit() {
  let point = randomSquare();
  while (pointInSnakeBody(point)) {
    point = randomSquare();
  }
  fruit.point = point;
  fruit.color = fruit.colors[Math.floor(Math.random() * fruit.colors.length)];

  return fruit;
}

function reInitSnake() {
  if (!winner) {
    // Game Over, reinit snake
    snake = {
      body: [{
        point: [12, 13, 14, 15],
        dir: 'up',
        color: [0, 255, 0]
      }, {
        point: [8, 9, 10, 11],
        dir: 'up',
        color: [0, 255, 0]
      }, {
        point: [4, 5, 6, 7],
        dir: 'up',
        color: [0, 255, 0]
      }, {
        point: [0, 1, 2, 3],
        dir: 'up',
        color: [0, 255, 0]
      }],
      speed: 400,
      lastMove: new Date()
    };
    moveFruit();
    turns.length = 0;
  }
}

function moveSnake() {
  let i;
  let j;
  let point;
  const body = snake.body;

  // Time since last movement
  const millis = (new Date() - snake.lastMove);
  if (millis > snake.speed) {
    const lastBodyPart = {
      point: body[body.length - 1].point.slice(),
      dir: body[body.length - 1].dir,
      color: body[body.length - 1].color
    };
    let poppedTurn;

    for (i = 0; i < body.length; i += 1) {
      point = body[i].point;

      // Check if any body parts are in a turn and set new direction
      for (j = 0; j < turns.length; j += 1) {
        if (equals(turns[j].point, point)) {
          body[i].dir = turns[j].dir;
          if (i === body.length - 1) { // Last body part
            poppedTurn = turns.pop(); // The whole snake has turned.
          }
        }
      }

      // Move body part in accordance with it's current direction
      for (j = 0; j < point.length; j += 1) {
        if (body[i].dir === 'up') {
          snake.body[i].point[j] = point[j] + point.length;
        } else if (body[i].dir === 'down') {
          snake.body[i].point[j] = point[j] - point.length;
        } else if (body[i].dir === 'left') {
          snake.body[i].point[j] = point[j] + gridSize[1];
        } else if (body[i].dir === 'right') {
          snake.body[i].point[j] = point[j] - gridSize[1];
        }
      }

      // Minimum brightness for head, full for the rest
      snake.body[0].color = [0, 0, 0];
      snake.body[i].color = [0, 255, 0];

      // Test for horizontal wall transition
      const totalPixels = gridSize[0] * gridSize[1];
      if (point[0] >= totalPixels) {
        for (j = 0; j < point.length; j += 1) {
          snake.body[i].point[j] = point[j] - totalPixels;
        }
      } else if (point[0] < 0) {
        for (j = 0; j < point.length; j += 1) {
          snake.body[i].point[j] = point[j] + totalPixels;
        }
      }
    }

    // Test for vertical wall transition
    testCrossVertical();

    // Grow snake
    if (grow) {
      snake.body.push(lastBodyPart);

      // Re-add the popped turn because the snake has
      // grown and the last body part needs to turn too.
      if (poppedTurn) {
        turns.push(poppedTurn);
      }

      grow = false;
    }

    // Head hit fruit?
    if (equals(fruit.point, body[0].point)) {
      grow = true;
      if (snake.speed > 0.1) { // A max playable speed seemingly
        snake.speed -= snake.speed * 0.03;
      }

      moveFruit();
    }

    snake.lastMove = new Date();
  } else {
    const factor = millis / snake.speed;
    // Gradually increase brightness of head and tail
    // TODO This is not quite smooth as the light level does not scale linearly.
    body[0].color = [0, 255 * factor, 0];
    if (!grow) {
      body[body.length - 1].color = [0, 255 * (1.25 - factor), 0];
    }
  }

  // Test for death (collision)
  for (i = 0; i < snake.body.length; i += 1) {
    point = snake.body[i].point;
    for (j = 0; j < snake.body.length; j += 1) {
      if (i !== j && equals(snake.body[j].point, point)) {
        // Winner!
        if (snake.body.length > winCondition) {
          winner = true;
        } else {
          reInitSnake();
        }
        // console.log('Final score: ', snake.body.length);
      }
    }
  }

  return snake;
}

function draw() {
  let i;
  let j;
  const notBlack = [];

  if (winner) {
    // Paint the picture
    for (i = 0; i < picture.length; i += 1) {
      const geom = picture[i];
      for (j = 0; j < geom.point.length; j += 1) {
        // Blink point
        if (geom.blink) {
          const millis = (new Date() - geom.blink);
          if (geom.waxWane) {
            geom.v = millis / blinkSpeed;
          } else { // Waxing
            geom.v = (blinkSpeed - millis) / blinkSpeed;
          } // Waning

          if (millis > blinkSpeed) {
            geom.blink = new Date();
            geom.waxWane = !geom.waxWane;
          }
        }

        // Set point color
        const color = OPC.hsv(geom.hue, geom.s, geom.v);
        client.setPixel(geom.point[j], color[0], color[1], color[2]);
        notBlack.push(geom.point[j]);
      }
    }
  } else {
    // Render snake
    const s = moveSnake();
    for (i = 0; i < s.body.length; i += 1) {
      const point = s.body[i].point;
      for (j = 0; j < point.length; j += 1) {
        client.setPixel(point[j], s.body[i].color[0], s.body[i].color[1], s.body[i].color[2]);
        notBlack.push(point[j]);
      }
    }

    // Render fruit
    const f = fruit;
    for (i = 0; i < f.point.length; i += 1) {
      client.setPixel(f.point[i], f.color[0], f.color[1], f.color[2]);
      notBlack.push(f.point[i]);
    }
  }

  // Set the black background
  for (i = 0; i < 4 * 9 * 14; i += 1) {
    if (notBlack.indexOf(i) === -1) {
      client.setPixel(i, 0, 0, 0);
    }
  }

  client.writePixels();
}

setInterval(draw, 10);
