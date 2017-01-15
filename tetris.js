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
 * Title: Tetris
 *
 * A Tetris clone for my bookshelf.
 */

// Requirements
const keypress = new require('keypress');
keypress(process.stdin);
const OPC = new require('./opc.js');
const fs = new require('fs');
const joystick = new (require('joystick'))(0, 3500, 350);

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
      if (!equals(array1[i], array2[i])) {
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
let lastDrop = new Date();
const winCondition = 35;
let winner;
let lines = 0;
let speed = 2000;
const speedIncrease = 50;
const blinkSpeed = 5000;
const picture = JSON.parse(fs.readFileSync('/home/omb/bookshelf/drawings/ring.json', 'utf8'));
for (let l = 0; l < picture.length; l += 1) {
  // Quirk; need to set the blink time for each blinking point
  if (picture[l].blink) {
    picture[l].blink = new Date();
  }
}

// Defining the display grid
const gridSize = [14, 9];
const cellSize = 4;
const grid = []; // Column, Row
const w = gridSize[0];
const h = gridSize[1];
// Slightly confusing since I'm reversing the grid. Upper left is now 1,1, lower right is 14,9
for (let i = w - 1; i >= 0; i -= 1) {
  grid[w - i] = [];
  for (let j = h - 1; j >= 0; j -= 1) {
    grid[w - i][h - j] = [];
    for (let k = 0; k < cellSize; k += 1) {
      grid[w - i][h - j][k] = (j * cellSize) + k + (i * h * cellSize);
    }
  }
}

// Define the Tetris pieces
let placed = true;
let pieces = [];

// The first point is always the center piece which is rotated around
const types = [{
  name: 'J',
  points: [
    [
        [0, 0],
        [-1, 0],
        [1, 0],
        [1, 1]
    ],
    [
        [0, 0],
        [0, 1],
        [0, -1],
        [-1, 1]
    ],
    [
        [0, 0],
        [-1, 0],
        [-1, -1],
        [1, 0]
    ],
    [
        [0, 0],
        [1, -1],
        [0, 1],
        [0, -1]
    ]
  ] // '''|
}, {
  name: 'L',
  points: [
    [
        [0, 0],
        [-1, 0],
        [-1, 1],
        [1, 0]
    ],
    [
        [0, 0],
        [0, 1],
        [0, -1],
        [1, 1]
    ],
    [
        [0, 0],
        [-1, 0],
        [1, 0],
        [1, -1]
    ],
    [
        [0, 0],
        [-1, -1],
        [0, -1],
        [0, 1]
    ]
  ] // |'''
}, {
  name: 'T',
  points: [
    [
        [0, 0],
        [0, 1],
        [-1, 0],
        [1, 0]
    ],
    [
        [0, 0],
        [0, -1],
        [0, 1],
        [1, 0]
    ],
    [
        [0, 0],
        [-1, 0],
        [0, -1],
        [1, 0]
    ],
    [
        [0, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ]
  ] // ':'
}, {
  name: 'S',
  points: [
    [
        [0, 0],
        [0, 1],
        [-1, 1],
        [1, 0]
    ],
    [
        [0, 0],
        [0, -1],
        [1, 0],
        [1, 1]
    ]
  ] // .:'
}, {
  name: 'Z',
  points: [
    [
        [0, 0],
        [0, 1],
        [-1, 0],
        [1, 1]
    ],
    [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, -1]
    ]
  ] // ':.
}, {
  name: 'O',
  points: [
    [
        [0, 0],
        [-1, 1],
        [-1, 0],
        [0, 1]
    ]
  ] // ::
}, {
  name: 'I',
  points: [
    [
        [0, 0],
        [-1, 0],
        [-2, 0],
        [1, 0]
    ],
    [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, -1]
    ]
  ] // ----
}];

// These colors appear most distinctly
const colors = [
  [255, 0, 0],
  [255, 0, 255],
  [0, 255, 255],
  [0, 0, 255]
]; // These colors appear most distinctly
let lastColor = [];

// Test for collisions, bottom, sides
function testCollision(point) {
  // At the bottom?
  if (point[1] > gridSize[1]) {
    return true;
  }

  // Test to se if piece has landed on another piece
  for (let j = 1; j < pieces.length; j += 1) {
    for (let k = 0; k < pieces[j].points.length; k += 1) {
      if (equals(pieces[j].points[k], point)) {
        return true;
      }
    }
  }

  return false;
}

// Define turns
function rotatePiece(key) {
  const piece = pieces[0];
  if (!piece) { return; }

  // Find the right template piece
  let template;
  let i;
  for (i = 0; i < types.length; i += 1) {
    if (types[i].name === piece.name) {
      template = types[i];
      break;
    }
  }

  // Iterate the orientation
  let o = piece.orientation + 1;
  if (key === 'w') {
    o = piece.orientation - 1;
  }

  if (o === template.points.length) {
    o = 0;
  } else if (o === -1) {
    o = template.points.length - 1;
  }

  // Translate the point
  const points = [];
  const ocol = piece.points[0][0];
  const orow = piece.points[0][1];
  for (i = 0; i < template.points[o].length; i += 1) {
    const tmpCol = template.points[o][i][0];
    const tmpRow = template.points[o][i][1];

    // Align with center
    const point = [];
    points[i] = point;
    point[0] = ocol + tmpCol;
    point[1] = orow + tmpRow;

    if (testCollision(point)) {
      return;
    }
  }

  // Update the piece if all points are ok.
  piece.orientation = o;
  piece.points = points;
}

function movePiece(key) {
  const piece = pieces[0];

  // Move the piece in the direction pressed
  const points = piece.points;
  const moved = [];
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i].slice();
    if (key === 'down') {
      point[1] += 1;
    } else if (key === 'right') {
      point[0] += 1;
    } else if (key === 'left') {
      point[0] -= 1;
    }

    // Outside grid
    if (point[0] > gridSize[0] || point[0] < 1) {
      return false;
    }

    if (testCollision(point)) { return false; }

    moved.push(point);
  }

  // Whole movement was ok. Set the new points to the piece.
  piece.points = moved;
  return true;
}

// Standard input
process.stdin.setRawMode(true);
process.stdin.on('keypress', (chunk, key) => {
  if (key && key.ctrl && key.name === 'c') process.exit();

  // Change direction if direction key pressed
  if (key && ['up', 'down', 'left', 'right'].indexOf(key.name) !== -1) {
    movePiece(key.name);
  } else if (key && ['q', 'w', 'space'].indexOf(key.name) !== -1) {
    rotatePiece(key.name);
  }
});

// Joystick input
const joyMapping = {
  0: 'q', // rotate left
  2: 'w', // rotate right,
  14: 'down',
  11: 'left',
  12: 'right'
};

joystick.on('button', (input) => {
  // Only respond to keydown, and ignore other buttons than those mapped.
  if (input.value === 0) {
    return;
  }

  const key = joyMapping[input.number];
  if (key && ['q', 'w'].indexOf(key) !== -1) {
    rotatePiece(key);
  } else {
    movePiece(key);
  }
});

function showWinScreen() {
  for (let i = 0; i < picture.length; i += 1) {
    const geom = picture[i];
    for (let j = 0; j < geom.point.length; j += 1) {
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
      // notBlack.push(geom.point[j]);
    }
  }
}

function newPiece() {
  let i;
  // Don't repeat colors
  let color = colors[Math.floor(Math.random() * colors.length)];
  while (equals(color, lastColor)) {
    color = colors[Math.floor(Math.random() * colors.length)];
  }
  lastColor = color;

  // TODO Needs to be weighted away from I blocks?
  const template = types[Math.floor(Math.random() * 7)];
  const points = [];
  for (i = 0; i < template.points[0].length; i += 1) {
    // Align with center
    points[i] = [];
    points[i][0] = template.points[0][i][0] + (gridSize[0] / 2) + 1;
    points[i][1] = template.points[0][i][1] + 1; // Since grid starts from 1
  }
  const piece = {
    name: template.name,
    orientation: 0,
    points,
    color
  };

  pieces.unshift(piece);

  for (i = 0; i < piece.points.length; i += 1) {
    if (testCollision(piece.points[i])) {
      // Game Over
      // console.log('Game over. Lines scored: ', lines);
      // TODO Show score in number on the grid
      pieces = [piece];

      if (lines > winCondition) {
        winner = true;
      }
      lines = 0;
      speed = 2000;
      return;
    }
  }
}

function checkLines() {
  // TODO This function is spectacularly inelegant because
  // I don't maintain the grid as a whole, just each piece.
  const filledLines = [];
  let i;
  let j;
  let k;
  let l;
  let m;
  for (i = 1; i < gridSize[1] + 1; i += 1) {
    let filled = true;
    for (j = 1; j < gridSize[0] + 1; j += 1) {
      let fill = false;
      for (k = 0; k < pieces.length; k += 1) {
        for (l = 0; l < pieces[k].points.length; l += 1) {
          if (equals(pieces[k].points[l], [j, i])) {
            fill = true;
            break;
          }
        }
      }
      if (!fill) {
        filled = false;
        break;
      }
    }
    if (filled) {
      filledLines.push(i);
    }
  }

  for (i = 1; i < gridSize[1] + 1; i += 1) {
    for (j = 1; j < gridSize[0] + 1; j += 1) {
      for (k = 1; k < pieces.length; k += 1) {
        for (l = 0; l < pieces[k].points.length; l += 1) {
          if (filledLines.indexOf(pieces[k].points[l][1]) !== -1) {
            pieces[k].points.splice(l, 1);
          }
        }
      }
    }
  }

  for (k = 0; k < pieces.length; k += 1) {
    for (l = 0; l < pieces[k].points.length; l += 1) {
      for (m = 0; m < filledLines.length; m += 1) {
        const point = pieces[k].points[l];
        if (point[1] < filledLines[m]) {
          point[1] += 1;
        }
      }
    }
  }

  lines += filledLines.length;
  if (filledLines.length > 0) {
    // Increase speed for each line scored.
    if (speed > 300) { speed -= speedIncrease; }
  }
}

function drop() {
  const piece = pieces[0];
  if (!piece) {
    newPiece();
    lastDrop = new Date();
    placed = false;
  }

  const time = new Date() - lastDrop;
  if (time > speed) {
    lastDrop = new Date();
    const points = piece.points.slice();
    for (let i = 0; i < points.length; i += 1) {
      const point = piece.points[i].slice();

      // Drop piece down one row
      point[1] += 1;

      placed = testCollision(point);
      if (placed) {
        checkLines();
        newPiece();
        lastDrop = new Date();
        placed = false;
        return;
      }

      // Not placed yet, update piece
      points[i] = point;
    }
    piece.points = points;
  }
}

function draw() {
  let i;
  let j;
  let k;
  const notBlack = [];

  if (winner) {
    showWinScreen();
  } else {
    drop();

    // Render pieces
    for (i = 0; i < pieces.length; i += 1) {
      const piece = pieces[i];
      for (j = 0; j < piece.points.length; j += 1) {
        const point = grid[piece.points[j][0]][piece.points[j][1]]; // Translate to grid coords
        if (point) {
          for (k = 0; k < point.length; k += 1) {
            client.setPixel(point[k], piece.color[0], piece.color[1], piece.color[2]);
            notBlack.push(point[k]);
          }
        }
      }
    }
  }

  // Set the black background
  for (i = 0; i < cellSize * gridSize[0] * gridSize[1]; i += 1) {
    if (notBlack.indexOf(i) === -1) {
      client.setPixel(i, 0, 0, 0);
    }
  }

  client.writePixels();
}

setInterval(draw, 10);
