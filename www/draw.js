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

const xhttp = new XMLHttpRequest();
var pickedColor = new iro.Color('#000000');
var colorWheel = iro.ColorPicker('#colorWheel', {});
var dropper = false;

function wheelColorChange(color, changes) {
    pickedColor = color;
    delete pickedColor.special;
    document.getElementById('hexInput').value = color.hexString;
}

function makeColorWheel( hexString ) {
    document.getElementById('colorWheel').children[0].remove();
    colorWheel = iro.ColorPicker('#colorWheel', {color: hexString});
    colorWheel.on('color:change', wheelColorChange);
}

colorWheel.on('color:change', wheelColorChange);

function send() {
    xhttp.open('POST', '/node/draw', true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(picture()));
}

function setColor(div) {
    var rgbString;
    //console.log(parseInt(div.id), parseInt(div.id)+1, parseInt(div.id)+2, parseInt(div.id)+3);

    if (dropper) {
        rgbString = div.style.backgroundColor;
        pickedColor = new iro.Color(rgbString);
        setBackColors(pickedColor);
        dropper = false;
        makeColorWheel(pickedColor.hexString);
    } else {
        div.style.background = ''; // In case it used to be rainbow
        div.style.backgroundColor = pickedColor.hexString;
        if (pickedColor.special === 'rainbow') {
            div.style.background = 'linear-gradient(to bottom, orange, yellow, green, cyan, blue, violet)';
        } else if (pickedColor.special === 'blink') {
            div.style.background = 'radial-gradient(black 1%, ' + pickedColor.rgbString + ', white)';
        }
        div.setAttribute('rgb', JSON.stringify(pickedColor.rgb));
        div.setAttribute('special', pickedColor.special);
        setBackColors(pickedColor);
        send();
    }
}

function setAll() {
    var i;
    var div;
    for (i=0; i < 504; i = i+4) {
        div = document.getElementById(i);
        div.style.background = ''; // In case it used to be rainbow
        div.style.backgroundColor = pickedColor.hexString;
        if (pickedColor.special === 'rainbow') {
            div.style.background = 'linear-gradient(to bottom, orange, yellow, green, cyan, blue, violet)';
        } else if (pickedColor.special === 'blink') {
            div.style.background = 'radial-gradient(black 1%, ' + pickedColor.rgbString + ', white)';
        }
        div.setAttribute('rgb', JSON.stringify(pickedColor.rgb));
        div.setAttribute('special', pickedColor.special);
    }
    setBackColors(pickedColor);
    send();
}

function revertColor(div) {
    pickedColor = JSON.parse(div.getAttribute('color'));
    makeColorWheel(pickedColor.hexString);
}

function setBackColors(color) {
    let i;
    let el;
    let lastEl;
    for (i=1; i<6; i=i+1) {
        if (document.getElementById('back'+i).style.backgroundColor === color.rgbString) {
            return;
        }
    }
    for (i=5; i>0; i=i-1) {
        el = document.getElementById('back'+i);
        if (lastEl) {
            lastEl.style.backgroundColor = el.style.backgroundColor;
            lastEl.setAttribute('color', el.getAttribute('color'));
        }
        if (i===1) {
            el.style.backgroundColor = color.hexString;
            el.setAttribute('color', JSON.stringify({
                hexString: color.hexString,
                rgb: color.rgb,
                rgbString: color.rgbString
            }));
        }
        lastEl = el;
    }
}

function save() {
    var a = document.createElement('a');
    var file = new Blob([JSON.stringify(picture())], {type: 'text/json'});
    a.href = URL.createObjectURL(file);
    a.download = 'picture.json';
    a.click();
}

function setBlink() {
    pickedColor.special = 'blink';
}

function setRainbow() {
    // TODO Set rainbow color to background
    pickedColor.special = 'rainbow';
}

function picture() {
    const file = [];
    var i;
    var rgb;
    var div;
    var point;
    var hsv;
    for (i=0; i < 504; i = i+4) {
        div = document.getElementById(i);
        rgbString = div.getAttribute('rgb');
        if (!rgbString) {
            rgb = {r:0,g:0,b:0};
        } else {
            rgb = JSON.parse(rgbString);
        }
        point = {
            point: [i,i+1,i+2,i+3],
            r: rgb.r,
            g: rgb.g,
            b: rgb.b
        };
        if (div.getAttribute('special') && div.getAttribute('special') !== 'undefined') {
            point.special = div.getAttribute('special');
            if (point.special === 'blink') {
                hsv = new iro.Color('rgb('+rgb.r+','+rgb.g+','+rgb.b+')').hsv;
                // TODO the hue conversion is wrong
                point.h = hsv.h/254;
                point.s = hsv.s/100;
                point.v = hsv.v/100;
                point.speed = parseInt(document.getElementById('blinkSpeedInput').value);
            } else {
                point.speed = parseFloat(document.getElementById('rainbowSpeedInput').value);
                point.intensity = parseFloat(document.getElementById('rainbowIntensityInput').value);
            }
        }
        file.push(point);
    }
    return file;
}

function setHexInput() {
    const hex = document.getElementById('hexInput').value;
    var color;
    var hexString;
    if (hex) {
        if (hex[0] !== '#') {
            hexString = '#' + hex;
        } else {
            hexString = hex;
        }
        pickedColor = new iro.Color(hexString);
        makeColorWheel(hexString);
    }
}

function pickColorFromGrid() {
    dropper = true;
}

function turnOff() {
    xhttp.open('POST', '/node/relay', true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify({off: true}));
}

function turnOn() {
    xhttp.open('POST', '/node/relay', true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify({on: true}));
}

function gamepad() {
    window.location.href = document.location.href + 'gamepad.html';
}