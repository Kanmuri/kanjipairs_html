# kanjipairs_html
Single HTML page Kanji Matching game

The goal here is to make a small game in JavaScript that can be run by just grabbing the files and opening the base HTML file in a modern web browser.
In fact that's the best way to do so at this time, as the KANJIDIC2 XML file is embedded directly in the HTML file. As such, the HTML file is about 14 MB in size.
This embedding was necessary to be able to run it locally, as the browser security model precludes reading the contents of an XML file via from disk via JavaScript when running locally.

This app uses the KANJIDIC2 XML file for its datasource.
This file is Copyright the [Electronic Dictionary Research and Development Group](http://www.edrdg.org/edrdg/licence.html) and is licensed under a [Creative Commons Attribution-ShareAlike License (V3.0)](http://creativecommons.org/licenses/by-sa/3.0/).

The file itself is available from the [KANJIDIC2 project page](http://www.csse.monash.edu.au/~jwb/kanjidic2/).
The version I am using is also available in the kanjidic2 directory/folder.

## How to play
* Click on the kanji one at a time to "flip over" the cards
* As the card is flipped over a randomly chosen reading (on or kun) will be shown
* Once a pair of cards is flipped over, one of two things will happen
  1. If the readings of those two cards match, then both "sides" of the card become visible and those cards are no longer clickable
  2. If the readings of those two cards don't match, then the cards are flipped over after a small delay

# TODO
* Make it look better
* Try and solve the race condition from clicking too many cards in quick succession
* Provide options to filter the random set, possible ideas include:
  1. 常用漢字 (Jouyou Kanji) -- Only show kanji in the "common use" set
  2. Filter by other metadata that's in the KANJIDIC2 file

