# kanjipairs_html
Single HTML page Kanji Matching game

The goal here is to make a small game in JavaScript that can be run by just grabbing the files and opening the base HTML file in a modern web browser.

Due to this self-imposed constraint of making the game playable from the local filesystem (i.e. via a `file://` URL), certain tradeoffs had to be made. For example:
* Because JS modules cannot be used from `file://` URLs, all the JS code had to be loaded the tradtional way (i.e. using `script` tags with `type` of `text/javascript`)
* JSON or XML files to read the kanji data from could not be read directly from the filesystem when using the `file://` protocol to serve the files, and thus the kanji data was instead rendered directly as a JS object in the `kanjidata.js` file

This app uses a trimmed-down JS object based on the the KANJIDIC2 XML file for its datasource.
This file is Copyright the [Electronic Dictionary Research and Development Group](http://www.edrdg.org/edrdg/licence.html) and is licensed under a [Creative Commons Attribution-ShareAlike License (V3.0)](http://creativecommons.org/licenses/by-sa/3.0/).

The file itself is available from the [KANJIDIC2 project page](http://www.csse.monash.edu.au/~jwb/kanjidic2/).
The version I am using is also available in the kanjidic2 directory/folder.

The timeout slider uses a <a href="http://jqueryui.com/themeroller/#!zThemeParams=5d000001000406000000000000003d8888d844329a8dfe02723de3e5701fa198449035fc0613ff729a37dd818cf92b1f6938fefa90282d04ae436bb72367f5909357c629e832248af2c086db4ab730aa4cced933a88449eca623ed37f3b23d47f58a712d809b6088edfb34a7d1f3386c892adf3bbfb5b94e2c1fadd742ed2978e0b046e107017c7fa376dbde4ab551002373089d55bfd83601f31506435bd2f0da1b5ad80ad0d9c0f0de37a1aa7ab6331211d539cbdef51ef902146e765621ae0fd05002f336d942e56dbb7087b1f450136fdf92dc9ee16f0d5376d95f34109e7b4ec8c00fbaa37d58132a19fe514d4c13dec9ae5a67058c8ce802adf6445062aa300b9c6ee7c46f6e79415228a13b89a9fbaeea6cd207a149f60c7acb56bef012ff0bce3a433456b3bdbc26f496a9916fa1d709bde980f3282b10cf49a5f0676a2c78c011805255d6c1c7b35c9837813e000ba950e2103e573762f553ea1b52672c8138e42c0881f723c42d3f48167ec1ae740b0ec2d2bbd64c5fe0177adf371a8c3ddbe58257426e88a12fe086758593b4ebd5a820266bce5e9febf8c74917c6b32733b5ab0c5fb18a1cc06433bccd1bc471fbc0cbfed4f15920eb22e5f8aa625bf0bead081a559795b84264a896ef79e70d0a4bd39627d97bb08a3dc3f6756b82489a34f2debdffda9d724298c46c626b405106d51ecc757eb8d1233e73c15b2fc50d783681e0179b78b1370dab59190c10248de1f060bffeae4a62">custom jQuery UI theme</a>.

The library <a href="http://touchpunch.furf.com/">jQuery UI Touch Punch</a> is used to enable touch events for the slider on mobile.

## How to play
* Click on the kanji one at a time to "flip over" the cards
* As the card is flipped over a randomly chosen reading (on or kun) will be shown
* Once a pair of cards is flipped over, one of two things will happen
  1. If the readings of those two cards match, then both "sides" of the card become visible and those cards are no longer clickable
  2. If the readings of those two cards don't match, then the cards are flipped over after a small (adjustable) delay

# TODO
* More filters?
