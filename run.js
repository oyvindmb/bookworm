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
const OPC = new require('./opc/opc');
const client = new OPC('localhost', 7890);
const express = require('express');
const joystick = new (require('./joystick/joystick.js'))(0, 3500, 350);


const http = express();
const port = 3000;
const fs = new require('fs');
const picture = JSON.parse(fs.readFileSync('/home/omb/bookworm/drawings/ring.json', 'utf8'));
let currentGame;
let currentGameNr;
let games;

function switchGame() {
  currentGameNr += 1;
  if (currentGameNr === games.length) {
    currentGameNr = 0;
  }
  currentGame = games[currentGameNr];
}
const tetris = new (require('./TetrisClass.js'))(35, 2000, 5000, 50, picture, client, OPC,
  switchGame);
const bookworm = new (require('./BookwormClass.js'))(35, 5000, picture, client, OPC, switchGame);
//const rainbow = new (require('./RainbowClass.js'))(0.002, 0.7, client, OPC, switchGame);
const drawGame = new (require('./DrawClass.js'))(client, OPC, switchGame, http);

//games = [rainbow, bookworm, tetris];
games = [drawGame, bookworm, tetris];
currentGameNr = 0;
currentGame = games[currentGameNr];

function draw() {
  currentGame.draw();
}

function onjoybutton(input) {
  currentGame.onJoyButton(input);
}
// Joystick input
joystick.on('button', onjoybutton);

// Set up HTTP server
http.get('/joystick/select', (request, response) => {
  onjoybutton({
    value: 1,
    number: 12
  });
  response.send('Select');
});

http.get('/joystick/down', (request, response) => {
  onjoybutton({
    value: 1,
    number: 1
  });
  response.send('Down');
});

http.get('/joystick/up', (request, response) => {
  onjoybutton({
    value: 1,
    number: 0
  });
  response.send('Up');
});

http.get('/joystick/left', (request, response) => {
  onjoybutton({
    value: 1,
    number: 2
  });
  response.send('Left');
});

http.get('/joystick/right', (request, response) => {
  onjoybutton({
    value: 1,
    number: 3
  });
  response.send('Right');
});

http.get('/joystick/a', (request, response) => {
  onjoybutton({
    value: 1,
    number: 4
  });
  response.send('A');
});

http.get('/joystick/b', (request, response) => {
  onjoybutton({
    value: 1,
    number: 5
  });
  response.send('B');
});

http.listen(port);

// Draw the bookshelf
setInterval(draw, 100);
