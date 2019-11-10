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
 * Title: Bookshelf monitor
 *
 * Monitors a PIR sensor and turns the bookshelf light on
 * if it senses movement. Off if no movement is detected for more than 60 minutes.
 */
const { Gpio } = require('onoff');
const express = require('express');
const http = express();
const port = 3001;
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const pir = new Gpio(17, 'in', 'both');
const relay = new Gpio(27, 'out');

// Could read position from relay.readSync(),
// but storing the light-value saves reading it every time the PIR sensor goes off
let light = 1;
let idleTime = 0;
let override = 0;
const maxIdle = 60 * 60; // In seconds

// The relay is non-latching and starts in the off position, so turn on now
relay.writeSync(1);

function exit() {
  pir.unexport();
  relay.unexport();
  process.exit();
}

pir.watch((err, value) => {
  if (override) { return; }
  if (err) exit();
  if (value === 1) {
    idleTime = 0;
    if (!light) {
      // Turn on light
      relay.writeSync(1);
      light = 1;
      console.log('Turned bookshelf on ', new Date());
    }
  }
});

function testIdle() {
  idleTime += 1;
  if (idleTime > maxIdle && light) {
    // Turn off light
    relay.writeSync(0);
    light = 0;
    console.log('Turned bookshelf off ', new Date());
  }
}

// Set up HTTP server
http.post('/node/relay', jsonParser, (request, response) => {
  const body = request.body;
  if (body.off) {
    relay.writeSync(0);
    light = 0;
    override = 1;
  } else if (body.on) {
    relay.writeSync(1);
    light = 1;
    override = 0;
    idleTime = 0;
  }
  response.send('Ok');
});

setInterval(testIdle, 1000);
http.listen(port);

console.log('Monitor started', new Date());
