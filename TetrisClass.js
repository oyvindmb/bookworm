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

class Tetris {
  constructor(winCondition, speed, blinkSpeed, speedIncrease, picture, client, OPC, switchGame) {
    let l;
    let i;
    let j;
    let k;

    this.client = client;
    this.OPC = OPC;
    this.switchGame = switchGame;
    this.lastDrop = new Date();
    this.winCondition = winCondition; // 35;
    this.drawInterval = 10;
    this.winner = false;
    this.lines = 0;
    this.speed = speed; // 2000;
    this.notBlack = [];
    this.speedIncrease = speedIncrease; // 50;
    this.blinkSpeed = blinkSpeed; // 5000;
    this.picture = picture; // JSON.parse(fs.readFileSync('ring.json', 'utf8'));
    for (l = 0; l < this.picture.length; l += 1) {
      // Quirk; need to set the blink time for each blinking point
      if (this.picture[l].blink) {
        this.picture[l].blink = new Date();
      }
    }

    // Defining the display grid
    this.gridSize = [14, 8];
    this.cellSize = 16;
    this.grid = []; // Column, Row
    [this.w, this.h] = this.gridSize;

    for (i = 1; i <= this.w; i += 1) {
      this.grid[i] = [];
      for (j = 1; j <= this.h; j += 1) {
        this.grid[i][j] = [];
        for (k = 0; k < this.cellSize; k += 1) {
          this.grid[i][j][k] = ((j-1) * this.cellSize) +
          k + ((i-1) * this.h * this.cellSize);
        }
      }
    }
    
    // Joystick input
    this.joyMapping = {
      12: 'return',
      6: 'q', // rotate left
      5: 'w', // rotate right,
      4: 'q',
      7: 'w',
      1: 'down',
      2: 'left',
      3: 'right'
    };

    // Define the Tetris pieces
    this.placed = true;
    this.pieces = [];

    // The first point is always the center piece which is rotated around
    this.types = [{
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
    this.colors = [
      [255, 0, 0],
      [255, 0, 255],
      [0, 255, 255],
      [0, 0, 255]
    ]; // These colors appear most distinctly
    this.lastColor = [];
  }

  equals(array1, array2) {
    let i;
    let l;

    if (!array1 || !array2) {
      return false;
    }

    // compare lengths, save time
    if (array1.length !== array2.length) {
      return false;
    }

    for (i = 0, l = array1.length; i < l; i += 1) {
      // Nested arrays?
      if (array1[i] instanceof Array && array2[i] instanceof Array) {
        if (!this.equals(array1[i], array2[i])) {
          return false;
        }
      } else if (array1[i] !== array2[i]) {
        return false;
      }
    }
    return true;
  }


  // Test for collisions, bottom, sides
  testCollision(point) {
    let j;
    let k;

    // At the bottom?
    if (point[1] > this.gridSize[1]) {
      return true;
    }

    // Test to se if piece has landed on another piece
    for (j = 1; j < this.pieces.length; j += 1) {
      for (k = 0; k < this.pieces[j].points.length; k += 1) {
        if (this.equals(this.pieces[j].points[k], point)) {
          return true;
        }
      }
    }

    return false;
  }

  // Define turns
  rotatePiece(key) {
    let template;
    let i;
    let o;
    let point;
    const points = [];

    const piece = this.pieces[0];
    if (!piece) { return; }

    // Find the right template piece
    for (i = 0; i < this.types.length; i += 1) {
      if (this.types[i].name === piece.name) {
        template = this.types[i];
        break;
      }
    }

    // Iterate the orientation
    o = piece.orientation + 1;
    if (key === 'w') {
      o = piece.orientation - 1;
    }

    if (o === template.points.length) {
      o = 0;
    } else if (o === -1) {
      o = template.points.length - 1;
    }

    // Translate the point
    const ocol = piece.points[0][0];
    const orow = piece.points[0][1];
    for (i = 0; i < template.points[o].length; i += 1) {
      const tmpCol = template.points[o][i][0];
      const tmpRow = template.points[o][i][1];

      // Align with center
      point = [];
      points[i] = point;
      point[0] = ocol + tmpCol;
      point[1] = orow + tmpRow;

      if (this.testCollision(point)) {
        return;
      }
    }

    // Update the piece if all points are ok.
    piece.orientation = o;
    piece.points = points;
  }

  movePiece(key) {
    let i;
    const piece = this.pieces[0];
    // Move the piece in the direction pressed
    const { points } = piece;
    const moved = [];

    for (i = 0; i < points.length; i += 1) {
      const point = points[i].slice();
      if (key === 'down') {
        point[1] += 1;
      } else if (key === 'right') {
        point[0] += 1;
      } else if (key === 'left') {
        point[0] -= 1;
      }

      // Outside grid
      if (point[0] > this.gridSize[0] || point[0] < 1) {
        return false;
      }

      if (this.testCollision(point)) { return false; }

      moved.push(point);
    }

    // Whole movement was ok. Set the new points to the piece.
    piece.points = moved;
    return true;
  }

  onJoyButton(input) {
    // Only respond to keydown, and ignore other buttons than those mapped.
    if (input.value === 0) {
      return;
    }

    const key = this.joyMapping[input.number];
    
    if (input.value && key && key === 'return') {
      this.switchGame();
    } else if (key && ['q', 'w'].indexOf(key) !== -1) {
      this.rotatePiece(key);
    } else {
      this.movePiece(key);
    }
  }

  showWinScreen() {
    let i;
    let j;

    for (i = 0; i < this.picture.length; i += 1) {
      const geom = this.picture[i];
      for (j = 0; j < geom.point.length; j += 1) {
        // Blink point
        if (geom.blink) {
          const millis = (new Date() - geom.blink);
          if (geom.waxWane) {
            geom.v = millis / this.blinkSpeed;
          } else { // Waxing
            geom.v = (this.blinkSpeed - millis) / this.blinkSpeed;
          } // Waning

          if (millis > this.blinkSpeed) {
            geom.blink = new Date();
            geom.waxWane = !geom.waxWane;
          }
        }

        // Set point color
        const color = this.OPC.hsv(geom.hue, geom.s, geom.v);
        this.client.setPixel(geom.point[j], color[0], color[1], color[2]);
        this.notBlack.push(geom.point[j]);
      }
    }
  }

  newPiece() {
    let i;
    // Don't repeat colors
    let color = this.colors[Math.floor(Math.random() * this.colors.length)];
    while (this.equals(color, this.lastColor)) {
      color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }
    this.lastColor = color;

    // TODO Needs to be weighted away from I blocks?
    const template = this.types[Math.floor(Math.random() * 7)];
    const points = [];
    for (i = 0; i < template.points[0].length; i += 1) {
    // Align with center
      points[i] = [];
      points[i][0] = template.points[0][i][0] + (this.gridSize[0] / 2) + 1;
      points[i][1] = template.points[0][i][1] + 1; // Since grid starts from 1
    }
    const piece = {
      name: template.name,
      orientation: 0,
      points,
      color
    };

    this.pieces.unshift(piece);

    for (i = 0; i < piece.points.length; i += 1) {
      if (this.testCollision(piece.points[i])) {
        // Game Over
        // console.log('Game over. Lines scored: ', lines);
        // TODO Show score in number on the grid
        this.pieces = [piece];

        if (this.lines > this.winCondition) {
          this.winner = true;
        }
        this.lines = 0;
        this.speed = 2000;
        return;
      }
    }
  }

  checkLines() {
    // TODO This function is spectacularly inelegant because
    // I don't maintain the grid as a whole, just each piece.
    const filledLines = [];
    let i;
    let j;
    let k;
    let l;
    let m;
    let filled;
    let fill;

    for (i = 1; i < this.gridSize[1] + 1; i += 1) {
      filled = true;
      for (j = 1; j < this.gridSize[0] + 1; j += 1) {
        fill = false;
        for (k = 0; k < this.pieces.length; k += 1) {
          for (l = 0; l < this.pieces[k].points.length; l += 1) {
            if (this.equals(this.pieces[k].points[l], [j, i])) {
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

    for (i = 1; i < this.gridSize[1] + 1; i += 1) {
      for (j = 1; j < this.gridSize[0] + 1; j += 1) {
        for (k = 1; k < this.pieces.length; k += 1) {
          for (l = 0; l < this.pieces[k].points.length; l += 1) {
            if (filledLines.indexOf(this.pieces[k].points[l][1]) !== -1) {
              this.pieces[k].points.splice(l, 1);
            }
          }
        }
      }
    }

    for (k = 0; k < this.pieces.length; k += 1) {
      for (l = 0; l < this.pieces[k].points.length; l += 1) {
        for (m = 0; m < filledLines.length; m += 1) {
          const point = this.pieces[k].points[l];
          if (point[1] < filledLines[m]) {
            point[1] += 1;
          }
        }
      }
    }

    this.lines += filledLines.length;
    if (filledLines.length > 0) {
      // Increase speed for each line scored.
      if (this.speed > 300) { this.speed -= this.speedIncrease; }
    }
  }

  drop() {
    let i;
    const piece = this.pieces[0];
    if (!piece) {
      this.newPiece();
      this.lastDrop = new Date();
      this.placed = false;
    }

    const time = new Date() - this.lastDrop;
    if (time > this.speed) {
      this.lastDrop = new Date();
      const points = piece.points.slice();
      for (i = 0; i < points.length; i += 1) {
        const point = piece.points[i].slice();

        // Drop piece down one row
        point[1] += 1;

        this.placed = this.testCollision(point);
        if (this.placed) {
          this.checkLines();
          this.newPiece();
          this.lastDrop = new Date();
          this.placed = false;
          return;
        }

        // Not placed yet, update piece
        points[i] = point;
      }
      piece.points = points;
    }
  }

  draw() {
    let i;
    let j;
    let k;

    if (this.winner) {
      this.showWinScreen();
    } else {
      this.notBlack = [];
      this.drop();

      // Render pieces
      for (i = 0; i < this.pieces.length; i += 1) {
        const piece = this.pieces[i];
        for (j = 0; j < piece.points.length; j += 1) {
          // Translate to grid coords
          const point = this.grid[piece.points[j][0]][piece.points[j][1]];
          if (point) {
            for (k = 0; k < point.length; k += 1) {
              this.client.setPixel(point[k], piece.color[0], piece.color[1], piece.color[2]);
              this.notBlack.push(point[k]);
            }
          }
        }
      }
    }

    // Set the black background
    for (i = 0; i < this.cellSize * this.gridSize[0] * this.gridSize[1]; i += 1) {
      if (this.notBlack.indexOf(i) === -1) {
        this.client.setPixel(i, 0, 0, 0);
      }
    }

    this.client.writePixels();
  }
}

module.exports = Tetris;
// setInterval(draw, 10);
