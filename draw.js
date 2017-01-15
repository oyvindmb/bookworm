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
 * Title: Draw
 *
 * Simple way to draw a picture in my neopixel bookshelf.
 */

// Requirements
const OPC = new require('./opc.js');
const fs = new require('fs');
const keypress = new require('keypress');
keypress(process.stdin);

// Connect OPC
const client = new OPC('localhost', 7890);

// Starting variables
let filename = 'new.json';
if (process.argv[2]) {
  filename = process.argv[2];
}

const gridSize = [14, 36]; // 14*36 = 504 total pixels
let lastKey;
const blinkSpeed = 5000;
let picture = [{
  point: [0, 1, 2, 3],
  hue: 1,
  s: 1,
  v: 1
}];

// Standard input
process.stdin.setRawMode(true);
process.stdin.on('keypress', (chunk, key) => {
  // console.log("Pressed:", key);
  let i;
  let l;
  let point;
  if (key && key.ctrl && key.name === 'c') process.exit();

  if (lastKey !== key) {
    if (key.name === 'up') {
      point = picture[0].point;
      for (i = 0; i < point.length; i += 1) {
        if (point[i] + 4 < 504) {
          picture[0].point[i] = point[i] + point.length;
        } else {
          return;
        }
      }
    } else if (key.name === 'down') {
      point = picture[0].point;
      for (i = 0; i < point.length; i += 1) {
        if (point[i] - 4 > 0) {
          picture[0].point[i] = point[i] - point.length;
        } else {
          return;
        }
      }
    } else if (key.name === 'left') {
      point = picture[0].point;
      for (i = 0; i < point.length; i += 1) {
        if (point[i] + 36 < 504) {
          picture[0].point[i] = point[i] + gridSize[1];
        } else {
          return;
        }
      }
    } else if (key.name === 'right') {
      point = picture[0].point;
      for (i = 0; i < point.length; i += 1) {
        if (point[i] - 36 > 0) {
          picture[0].point[i] = point[i] - gridSize[1];
        } else {
          return;
        }
      }
    } else if (key.name === 'w') {
      if (picture[0].v !== 1) {
        picture[0].v += 0.1;
      }
    } else if (key.name === 's') {
      if (picture[0].v !== 0) {
        picture[0].v -= 0.1;
      }
    } else if (key.name === 'a') {
      if (picture[0].hue !== 1) {
        picture[0].hue += 0.01;
      }
    } else if (key.name === 'd') {
      if (picture[0].hue !== 0) {
        picture[0].hue -= 0.01;
      }
    } else if (key.name === 'c') {
      if (picture[0].s !== 1) {
        picture[0].s += 0.01;
      }
    } else if (key.name === 'x') {
      if (picture[0].s !== 0) {
        picture[0].s -= 0.01;
      }
    } else if (key.name === 'v') {
      // White
      picture[0].hue = 1;
      picture[0].v = 1;
      picture[0].s = 0;
    } else if (key.name === 'b') {
      picture[0].blink = new Date();
      picture[0].waxWane = true;
    } else if (key.name === 'space') {
      picture.unshift({
        point: [0, 1, 2, 3],
        hue: picture[0].hue,
        s: picture[0].s,
        v: picture[0].v,
      });
    } else if (key.name === 'enter') {
      fs.writeFile(filename, JSON.stringify(picture, null, 4), (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log(`JSON saved to ${filename}`);
        }
      });
    } else if (key.name === 'l') {
      picture = JSON.parse(fs.readFileSync(filename, 'utf8'));
      for (l = 0; l < picture.length; l += 1) {
        // Quirk; need to set the blink time for each blinking point
        if (picture[l].blink) {
          picture[l].blink = new Date();
        }
      }
    }
    lastKey = key;
  }
});

function draw() {
  let i;
  let j;
  let color;
  const notBlack = [];

  // Paint the picture
  for (i = 0; i < picture.length; i += 1) {
    const geom = picture[i];
    for (j = 0; j < geom.point.length; j += 1) {
      // Blink point
      if (geom.blink) {
        const millis = (new Date() - geom.blink);
        if (geom.waxWane) {
          geom.v = millis / blinkSpeed;
        } else {
          geom.v = (blinkSpeed - millis) / blinkSpeed;
        }

        if (millis > blinkSpeed) {
          geom.blink = new Date();
          geom.waxWane = !geom.waxWane;
        }
      }

      // Set point color
      color = OPC.hsv(geom.hue, geom.s, geom.v);
      client.setPixel(geom.point[j], color[0], color[1], color[2]);
      notBlack.push(geom.point[j]);
    }
  }

  // Set the other pixels black
  for (i = 0; i < 4 * 9 * 14; i += 1) {
    if (notBlack.indexOf(i) === -1) {
      client.setPixel(i, 0, 0, 0);
    }
  }
  client.writePixels();
}

setInterval(draw, 10);
