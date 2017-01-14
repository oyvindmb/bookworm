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

// Requirements
const OPC = new require('./opc.js');

// Connect OPC
const client = new OPC('localhost', 7890);

// Starting variables
const start = new Date();

function draw() {
  const millis = (new Date() - start);

  for (let pixel = 0; pixel < 4 * 9 * 14; pixel += 1) {
    const hue = ((millis * 0.002) + (pixel * 2.0)) % 100;
    const color = OPC.hsv(hue / 100, 1, 1);
    client.setPixel(pixel, color[0], color[1], color[2]);
  }
  client.writePixels();
}

setInterval(draw, 30);
