# bookworm
I  created a bookshelf made of a 14x9 grid of squares. In each square are four neopixels hooked up to two Fadecandy controllers and a Raspberry Pi. This project contains some javascript games created for this bookshelf grid.

The first one; "Bookworm", I used to propose to my then girlfriend, now wife. Therefore the win screen shows a picture of an engagement ring. The second one is a Tetris clone. Both may have some quirks and bugs, since this was largely created as a proof of concept. Day to day we use the rainbow.js to show a gradualy changing set of colors, which adds a bit of ambiance to our living room.  

This project requires the Fadecandy Server to be set up and opc.js from https://github.com/scanlime/fadecandy

The configuration file for fadecandy server is set up like this (not I use two fadecandy controllers):

  {
      "listen": [null, 7890],
    "verbose": true,

    "color": {
        "gamma": 2.5,
        "whitepoint": [1,1,1]
    },

    "devices": [
        {
            "type": "fadecandy",
            "serial": "xxxxxxxxxxxxxxxxx",
	    "led": false,
            "map": [
                [ 0, 0, 0, 36 ],
                [ 0, 36, 64, 36 ],
                [ 0, 72, 128, 36 ],
                [ 0, 108, 192, 36 ],
                [ 0, 144, 256, 36 ],
                [ 0, 180, 320, 36 ],
                [ 0, 216, 384, 36 ]
            ]
        },
        {
            "type": "fadecandy",
            "serial": "xxxxxxxxxxxxxxxxx",
	    "led": false,
            "map": [
                [ 0, 252, 0, 36 ],
                [ 0, 288, 64, 36 ],
                [ 0, 324, 128, 36 ],
                [ 0, 360, 192, 36 ],
                [ 0, 396, 256, 36 ],
                [ 0, 432, 320, 36 ],
                [ 0, 468, 384, 36 ]
            ]
        }
    ]
  }

You can read more about the project on my wifes blog here:
  https://nakri.no/2015/the-bookshelf-that-went-viral/
  https://nakri.no/2015/the-bookshelf-updated-tetris/

and in the wiki, which has some more details on how my bookshelf was made and som videos of the finished product.

The bookshelf has gone viral several times. First time through imgur:
  http://imgur.com/gallery/pmQq1mE

Most recently here:
  https://www.reddit.com/r/gaming/comments/5mjxmv/playable_bookshelf_tetris/?st=ixnh2e4x&sh=3d3530b1
