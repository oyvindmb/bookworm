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
class Bookworm {
  constructor(winCondition, blinkSpeed, picture, client, OPC, switchGame) {
    let i;
    let l;
    this.client = client;
    this.OPC = OPC;
    this.switchGame = switchGame;
    // Starting variables
    this.drawInterval = 10;
    this.lastKey = null;
    this.grow = false;
    // TODO Generalize grid to own class?
    this.gridSize = [14, 36]; // width, height i.e. total pixels 14*36 = 504
    this.bottomRow = [];
    this.topRow = [];
    for (i = 0; i < this.gridSize[0]; i += 1) {
      // One pixel in the bottom and top rows
      this.bottomRow.push(i * this.gridSize[1]);
      this.topRow.push((i * this.gridSize[1]) + (this.gridSize[1] - 1));
    }
    this.winCondition = winCondition;
    this.winner = false;
    this.blinkSpeed = blinkSpeed;
    this.picture = picture;
    this.joyMapping = {
      6: 'return',
      3: 'up',
      0: 'down',
      2: 'left',
      1: 'right',
      13: 'up',
      14: 'down',
      11: 'left',
      12: 'right'
    };
    for (l = 0; l < this.picture.length; l += 1) {
      // Quirk; need to set the blink time for each blinking point
      if (this.picture[l].blink) this.picture[l].blink = new Date();
    }
    // Definition of snake sprite
    this.snake = {
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
    this.fruit = {
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
    this.turns = [];
  }

  registerTurn(dir) {
    const point = this.snake.body[0].point.slice();
    // Ignore opposite direction
    if (this.lastKey === 'up' && dir === 'down') {
      return false;
    }
    if (this.lastKey === 'down' && dir === 'up') {
      return false;
    }
    if (this.lastKey === 'left' && dir === 'right') {
      return false;
    }
    if (this.lastKey === 'right' && dir === 'left') {
      return false;
    }
    // Register turn
    for (let i = 0; i < this.turns.length; i += 1) {
      if (this.equals(this.turns[i].point, point)) {
        return false;
      }
    }
    // TODO Depending on current counter, register next turn? Smoother gameplay?
    this.turns.unshift({
      point,
      dir
    });
    return true;
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

  onJoyButton(input) {
    // Only respond to keydown, and ignore other buttons than those mapped.
    const key = this.joyMapping[input.number];
    if (input.value && key && key === 'return') {
      this.switchGame();
    } else if (input.value && key) {
      this.registerTurn(key);
    }
  }

  testCrossVertical() {
    let i;
    let l;
    const { body } = this.snake;
    for (i = 0; i < body.length; i += 1) {
      if (this.bottomRow.indexOf(body[i].point[0]) !== -1 && body[i].dir === 'up') {
        // Top to bottom transition, continue snake on same column
        for (l = 0; l < body[i].point.length; l += 1) {
          body[i].point[l] -= this.gridSize[1];
        }
        return;
      } if (this.topRow.indexOf(body[i].point[3]) !== -1 && body[i].dir === 'down') {
        // Bottom to top transition, continue snake on same column
        for (l = 0; l < body[i].point.length; l += 1) {
          body[i].point[l] += this.gridSize[1];
        }
        return;
      } if (body[i].point[0] === this.gridSize[0] * this.gridSize[1]) {
        // Corner case, literally
        body[i].point = [0, 1, 2, 3];
      }
    }
  }

  moveSnake() {
    const { body } = this.snake;
    let lastBodyPart;
    let poppedTurn;
    let i;
    let j;
    let point;
    const totalPixels = this.gridSize[0] * this.gridSize[1];
    // Time since last movement
    const millis = (new Date() - this.snake.lastMove);
    const factor = millis / this.snake.speed;
    if (millis > this.snake.speed) {
      lastBodyPart = {
        point: body[body.length - 1].point.slice(),
        dir: body[body.length - 1].dir,
        color: body[body.length - 1].color
      };
      for (i = 0; i < body.length; i += 1) {
        point = body[i].point;
        // Check if any body parts are in a turn and set new direction
        for (j = 0; j < this.turns.length; j += 1) {
          if (this.equals(this.turns[j].point, point)) {
            body[i].dir = this.turns[j].dir;
            if (i === body.length - 1) { // Last body part
              poppedTurn = this.turns.pop(); // The whole snake has turned.
            }
          }
        }
        // Move body part in accordance with it's current direction
        for (j = 0; j < point.length; j += 1) {
          if (body[i].dir === 'up') {
            this.snake.body[i].point[j] = point[j] + point.length;
          } else if (body[i].dir === 'down') {
            this.snake.body[i].point[j] = point[j] - point.length;
          } else if (body[i].dir === 'left') {
            this.snake.body[i].point[j] = point[j] + this.gridSize[1];
          } else if (body[i].dir === 'right') {
            this.snake.body[i].point[j] = point[j] - this.gridSize[1];
          }
        }
        // Minimum brightness for head, full for the rest
        this.snake.body[0].color = [0, 0, 0];
        this.snake.body[i].color = [0, 255, 0];
        // Test for horizontal wall transition
        if (point[0] >= totalPixels) {
          for (j = 0; j < point.length; j += 1) {
            this.snake.body[i].point[j] = point[j] - totalPixels;
          }
        } else if (point[0] < 0) {
          for (j = 0; j < point.length; i += 1) {
            this.snake.body[i].point[j] = point[j] + totalPixels;
          }
        }
      }
      // Test for vertical wall transition
      this.testCrossVertical();
      // Grow snake
      if (this.grow) {
        this.snake.body.push(lastBodyPart);
        // Re-add the popped turn because the snake has grown and
        // the last body part needs to turn too.
        if (poppedTurn) {
          this.turns.push(poppedTurn);
        }
        this.grow = false;
      }
      // Head hit fruit?
      if (this.equals(this.fruit.point, body[0].point)) {
        this.grow = true;
        if (this.snake.speed > 0.1) { // A max playable speed seemingly
          this.snake.speed = this.snake.speed - (this.snake.speed * 0.03);
        }
        this.moveFruit();
      }
      this.snake.lastMove = new Date();
    } else {
      // Gradually increase brightness of head and tail
      // TODO This is not quite smooth as the light level does not scale linearly.
      body[0].color = [0, 255 * factor, 0];
      if (!this.grow) body[body.length - 1].color = [0, 255 * (1.25 - factor), 0];
    }
    // Test for death (collision)
    for (i = 0; i < this.snake.body.length; i += 1) {
      point = this.snake.body[i].point;
      for (j = 0; j < this.snake.body.length; j += 1) {
        if (i !== j && this.equals(this.snake.body[j].point, point)) {
          // Winner!
          if (this.snake.body.length > this.winCondition) {
            // console.log('Final score: ', this.snake.body.length);
            this.winner = true;
          } else {
            this.reInitSnake();
          }
        }
      }
    }
  }

  reInitSnake() {
    if (!this.winner) {
      // Game Over, reinit snake
      this.snake = {
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
      this.moveFruit();
      this.turns.length = 0;
    }
  }

  randomSquare() {
    const high = this.gridSize[0] * (this.gridSize[1] / 4); // Number of squares
    const low = 0;
    let start = Math.floor((Math.random() * (high - (low + 1))) + low);
    if (start > 0) {
      start *= 4; // Since there are actually four pixels per square
    }
    return [start, start + 1, start + 2, start + 3];
  }

  pointInSnakeBody(point) {
    let i;
    for (i = 0; i < this.snake.body.length; i += 1) {
      if (this.equals(this.snake.body[i].point, point)) {
        return true;
      }
    }
    return false;
  }

  moveFruit() {
    let point = this.randomSquare();
    while (this.pointInSnakeBody(point)) {
      point = this.randomSquare();
    }
    this.fruit.point = point;
    this.fruit.color = this.fruit.colors[Math.floor(Math.random() * this.fruit.colors.length)];
  }

  draw() {
    const notBlack = [];
    let i;
    let j;
    let color;
    let geom;
    let millis;
    let point;
    if (this.winner) {
      // Paint the picture
      for (i = 0; i < this.picture.length; i += 1) {
        geom = this.picture[i];
        for (j = 0; j < geom.point.length; j += 1) {
          // Blink point
          if (geom.blink) {
            millis = (new Date() - geom.blink);
            if (geom.waxWane) geom.v = millis / this.blinkSpeed; // Waxing
            else geom.v = (this.blinkSpeed - millis) / this.blinkSpeed; // Waning
            if (millis > this.blinkSpeed) {
              geom.blink = new Date();
              geom.waxWane = !geom.waxWane;
            }
          }
          // Set point color
          color = this.OPC.hsv(geom.hue, geom.s, geom.v);
          this.client.setPixel(geom.point[j], color[0], color[1], color[2]);
          notBlack.push(geom.point[j]);
        }
      }
    } else {
      // Render snake
      this.moveSnake();
      for (i = 0; i < this.snake.body.length; i += 1) {
        point = this.snake.body[i].point;
        for (j = 0; j < point.length; j += 1) {
          this.client.setPixel(point[j], this.snake.body[i].color[0], this.snake.body[i].color[1],
            this.snake.body[i].color[2]);
          notBlack.push(point[j]);
        }
      }
      // Render fruit
      for (i = 0; i < this.fruit.point.length; i += 1) {
        this.client.setPixel(
          this.fruit.point[i], this.fruit.color[0], this.fruit.color[1], this.fruit.color[2]
        );
        notBlack.push(this.fruit.point[i]);
      }
    }
    // Set the black background
    for (i = 0; i < 4 * 9 * 14; i += 1) {
      if (notBlack.indexOf(i) === -1) {
        this.client.setPixel(i, 0, 0, 0);
      }
    }
    this.client.writePixels();
  }
}
module.exports = Bookworm;
