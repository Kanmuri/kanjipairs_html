# kanjipairs_html
Single HTML page Kanji Matching game

The goal here is to make a small game in JavaScript that can be run by just grabbing the files and opening the base HTML file in a modern web browser.

This app uses the KANJIDIC2 XML file for its datasource.
This file is Copyright the [Electronic Dictionary Research and Development Group](http://www.edrdg.org/edrdg/licence.html) and is licensed under a [Creative Commons Attribution-ShareAlike License (V3.0)](http://creativecommons.org/licenses/by-sa/3.0/).

The file itself is available from the [KANJIDIC2 project page](http://www.csse.monash.edu.au/~jwb/kanjidic2/).
The version I am using is also available in the kanjidic2 directory/folder.

## How to play
* Click on the kanji one at a time to "flip over" the cards
* As the card is flipped over a randomly chosen reading (on or kun) will be shown
* Once a pair of cards is flipped over, one of two things will happen
  1) If the readings of those two cards match, then both "sides" of the card become visible and those cards are no longer clickable
  2) If the readings of those two cards don't match, then the cards are flipped over after a small delay

