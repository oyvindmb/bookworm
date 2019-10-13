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
 * 2019 Øyvind Berntsen
 * Title: Draw
 *
 * Simple way to draw a picture in my neopixel bookshelf.
 */

// Requirements
const OPC = new require('./opc/opc');
const client = new OPC('localhost', 7890);
const express = require('express');
const http = express();
const port = 3000;
const fs = new require('fs');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const rainbowIntensity = 0.8;
const rainbowSpeed = 0.002;
const start = new Date();
const gridSize = [14, 36]; // 14*36 = 504 total pixels
const blinkSpeed = 5000;
let picture = [{
  point: [0, 1, 2, 3],
  hue: 1,
  s: 1,
  v: 1
}];

// Set up HTTP server
http.post('/node/draw', jsonParser, (request, response) => {
  picture = request.body;
  response.send('Ok');
});

function draw() {
  let i;
  let j;
  let color;
  let hue;
  let millis = (new Date() - start);
  let blinkMillis;
  const notBlack = [];

  // Paint the picture
  for (i = 0; i < picture.length; i += 1) {
    const geom = picture[i];
    for (j = 0; j < geom.point.length; j += 1) {

      // Set point color
      if (geom.special === 'rainbow') {
        if (!geom.speed) { geom.speed = rainbowSpeed; }
        if (!geom.intensity) { geom.intensity = rainbowIntensity; }
        hue = (millis * geom.speed + geom.point[j] * 2.0) % 100;
        color = OPC.hsv(hue / 100, 1, geom.intensity);
      } else if (geom.special === 'blink') {
        if (!geom.speed) { geom.speed = blinkSpeed; }
        if (!geom.blink) {
          geom.blink = new Date();
        }
        blinkMillis = (new Date() - geom.blink);
        if (geom.waxWane) {
          geom.v = blinkMillis / geom.speed;
        } else {
          geom.v = (geom.speed - blinkMillis) / geom.speed;
        }

        if (blinkMillis > geom.speed) {
          geom.blink = new Date();
          geom.waxWane = !geom.waxWane;
        }
        color = OPC.hsv(geom.h, geom.s, geom.v);
      } else if (geom.h && geom.s && geom.v) {
        color = OPC.hsv(geom.h, geom.s, geom.v);
      } else {
        color = [geom.r,geom.g,geom.b];
      }

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

http.listen(port);
setInterval(draw, 10);