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
const joystick = new (require('./joystick/joystick.js'))(0, 3500, 350);

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
const rainbow = new (require('./RainbowClass.js'))(0.002, 0.8, client, OPC, switchGame);

games = [rainbow, bookworm, tetris];
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
// Draw the bookshelf
setInterval(draw, 100);
