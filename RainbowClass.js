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
// Good starting variables
// intensity = 0.8;
// speed = 0.002;
class Rainbow {
  constructor(speed, intensity, client, OPC, switchGame) {
    this.drawInterval = 30;
    this.speed = speed;
    this.intensity = intensity;
    this.client = client;
    this.OPC = OPC;
    this.switchGame = switchGame;
    this.start = new Date();
    this.joyMapping = {
      12: 'return',
      13: 'restart',
      0: 'up',
      1: 'down',
      2: 'left',
      3: 'right',
      7: 'up',
      4: 'down',
      6: 'left',
      5: 'right'
    };
  }

  draw() {
    const millis = (new Date() - this.start);
    let pixel;
    let hue;
    let color;
    for (pixel = 0; pixel < 16 * 8 * 14; pixel += 1) {
      hue = (millis * this.speed + pixel * 0.5) % 100;
      color = this.OPC.hsv(hue / 100, 1, this.intensity);
      this.client.setPixel(pixel, color[0], color[1], color[2]);
    }
    this.client.writePixels();
  }

  onJoyButton(input) {
    // Only respond to keydown, and ignore other buttons than those mapped.
    if (input.value === 0) return;

    const key = this.joyMapping[input.number];
    if (input.value && key && key === 'return') {
      this.switchGame();
    } else if (input.value && key && key === 'up') {
      if (this.intensity < 1.0) {
        this.intensity = this.intensity + 0.1;
      }
    } else if (input.value && key && key === 'down') {
      if (this.intensity > 0.1) {
        this.intensity = this.intensity - 0.1;
      }
    } else if (input.value && key && key === 'left') {
      if (this.speed > 0.001) {
        this.speed = this.speed - 0.001;
      }
    } else if (input.value && key && key === 'right') {
      if (this.speed < 0.1) {
        this.speed = this.speed + 0.001;
      }
    }
    // console.log('intensity', this.intensity, 'speed', this.speed);
  }
}
module.exports = Rainbow;
