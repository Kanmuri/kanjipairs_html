KanjiPairs = function(kanjiData, canvasId) {
	var that = this;
	//presets
	this.cardWidth = 100;
	this.cardHeight = 135;
	this.cardSpacing = 10;
	this.cardFill = 'blue';
	this.cardStroke = 'outside 1px black';
	this.cardShadow = '5px 5px 10px gray';

	this.kanjiTextProps = {
		x: 12.5,
		y: 30,
		font: '75px',
		fill: 'white'
	};

	this.readingTextProps = {
		x: 5,
		y: 10,
		font: '16px',
		fill: 'white',
	};

	this.canvasId = canvasId;
	this.pairsCanvas = oCanvas.create({
		canvas: '#' + canvasId,
		background: 'white'
	});

	this.kanjiData = kanjiData;
	this.indexedReadings = this.indexReadings(this.kanjiData);
	this.prunedReadingIndex = this.pruneIndexedReadings(this.indexedReadings, 2);

	this.flippedCards = [];
};

KanjiPairs.prototype.indexReadings = function(characterReadings) {
	var indexedReadings = {};
	$.each(characterReadings, function(index, currChar) {
		var characterIndex = index;
		$.each(currChar.readings, function(index, currReading) {
			if(!indexedReadings.hasOwnProperty(currReading.readingText)) {
				indexedReadings[currReading.readingText] = [];
			}
			indexedReadings[currReading.readingText].push(characterIndex);
		});
	});

	return indexedReadings;
}

KanjiPairs.prototype.pruneIndexedReadings = function(indexedReadings, minResults) {
	//This function prunes the readings index to have only those readings where there is more than one kanji that has that same reading
	var prunedReadings = {};
	$.each(indexedReadings, function(index, currIndexArray) {
		if(currIndexArray.length >= minResults) {
			prunedReadings[index] = currIndexArray;
		}
	});

	return prunedReadings;
}

KanjiPairs.prototype.pickRandomReading = function(indexedReadings) {
	var readingKeys = Object.keys(indexedReadings);
	//The bit shift (<<) is shorthand that truncates the value to an integer value
	var randomIndex = readingKeys[readingKeys.length * Math.random() << 0];
	return randomIndex;
}

KanjiPairs.prototype.pickRandomReadings = function(indexedReadings, numberOfReadings) {
	var readingKeys = Object.keys(indexedReadings);
	var readingPicks = [];

	for(var i = 0; i < numberOfReadings;) {
		//The bit shift (<<) is shorthand that truncates the value to an integer value
		var randomIndex = readingKeys[readingKeys.length * Math.random() << 0];
		if($.inArray(randomIndex, readingPicks) === -1) {
			readingPicks.push(randomIndex);
			i++;
		}
	}

	return readingPicks;
}

KanjiPairs.prototype.createKanjiSet = function(indexedReadings, numberOfKanji) {
	//Force number of kanji to be an integer
	numberOfKanji = numberOfKanji << 0;

	//Since this is a pairs game, the number of kanji must be an even number. 
	if(numberOfKanji % 2 !== 0) {
		//If not even, subtract one.
		numberOfKanji--;
	}

	//Number of kanji must be at least 2
	if(numberOfKanji < 2) {
		numberOfKanji = 2;
	}

	//Grab enough readings for half the number of kanji (as each pair of kanji must share a reading)
	var randomReadings = this.pickRandomReadings(indexedReadings, numberOfKanji / 2);

	var kanjiArray = [];

	for(var currentReadingIndex = 0; currentReadingIndex < numberOfKanji / 2;) {
		//Get random kanji from this loop's reading
		var currReading = randomReadings[currentReadingIndex];
		var currReadingKanji = indexedReadings[currReading];
		var numKanjiForReading = currReadingKanji.length;
		//Need to make sure there's at least two. Those with only one should have already been pruned off, but this is here just in case
		if(numKanjiForReading >= 2) {
			for(var numKanjiForPair = 0; numKanjiForPair < 2;) {
				if(numKanjiForReading === 2) {
					//If there are only two kanji for the reading, add both of them, one at a time
					var randomKanji = currReadingKanji[numKanjiForPair];
					var kanjiItem = {kanjiIndex: randomKanji, selectedReading: currReading};
					var kanjiOkToAdd = true;
				}
				else {
					var randomKanji = currReadingKanji[numKanjiForReading * Math.random() << 0];
					var kanjiItem = {kanjiIndex: randomKanji, selectedReading: currReading};
					var kanjiOkToAdd = (!this.checkForKanji(kanjiArray, kanjiItem));
				}


				if(kanjiOkToAdd) {
					var foundOpenSpot = false;
					while(!foundOpenSpot) {
						var randomIndex = numberOfKanji * Math.random() << 0;
						if(typeof kanjiArray[randomIndex] === 'undefined') {
							kanjiArray[randomIndex] = kanjiItem;
							foundOpenSpot = true;
							numKanjiForPair++;
						}
					}
				}
			}
			currentReadingIndex++;
		}
		else {
			//get a different random reading to replace this one
			randomReadings[currentReadingIndex] = this.pickRandomReading(indexedReadings);
		}
	}

	return kanjiArray;
}

KanjiPairs.prototype.checkForKanji = function(kanjiArray, kanjiItem) {
	var matchFound = false;
	$.each(kanjiArray, function(index, val) {
		if((typeof val !== 'undefined') && val.kanjiIndex == kanjiItem.kanjiIndex && val.selectedReading == kanjiItem.selectedReading) {
			matchFound = true;
			return false; //return false breaks us out of the .each() loop
		}
	});

	return matchFound;
}

KanjiPairs.prototype.addCard = function(kanjiItem, xPos, yPos, delayRedraw) {
	var that = this;
	var newCardBack = this.pairsCanvas.display.rectangle({
		x: xPos,
		y: yPos,
		width: this.cardWidth,
		height: this.cardHeight,
		fill: this.cardFill,
		stroke: this.cardStroke,
		shadow: this.cardShadow
	});

	var kanjiCharacter = this.kanjiData[kanjiItem.kanjiIndex];
	var kanjiTextObject = this.pairsCanvas.display.text(
		$.extend({text: kanjiCharacter.literal}, this.kanjiTextProps)
	);
	kanjiTextObject.visibleState = 'unflipped';

	var readingTextObject = this.pairsCanvas.display.text(
		$.extend({text: kanjiItem.selectedReading, opacity: 0}, this.readingTextProps)
	);
	readingTextObject.visibleState = 'flipped';

	newCardBack.kanjiItem = kanjiItem;
	newCardBack.addChild(kanjiTextObject);
	newCardBack.addChild(readingTextObject);

	newCardBack.clickHandler = function(){
		if($.inArray(this, that.flippedCards) === -1) {
			that.flippedCards.push(this);
			if(that.flippedCards.length < 3 && (that.flippedCards[0] === this || that.flippedCards[1] === this)) {
				if(!this.flipped) {
					that.toggleCard(this, 'flipped');
					this.flipped = true;
				}
				if(that.flippedCards.length > 1) {
					if(that.flippedCards[0].kanjiItem.selectedReading == this.kanjiItem.selectedReading) {
						that.flippedCards[0].unbind('click tap', that.flippedCards[0].clickHandler);
						this.unbind('click tap', this.clickHandler);
						that.toggleCard(that.flippedCards[0], 'both');
						that.toggleCard(this, 'both');
					}
					else {
						(function(firstCard, secondCard, kanjiPairsObj){
							setTimeout(function(){
								kanjiPairsObj.toggleCard(firstCard, 'unflipped');
								firstCard.flipped = false;
								kanjiPairsObj.toggleCard(secondCard, 'unflipped');
								secondCard.flipped = false;
							}, 1500);
						})(that.flippedCards[0], this, that);
					}
					while(that.flippedCards.length) {
						that.flippedCards.pop();
					}
				}
			}
		}
	};

	newCardBack.bind('click tap', newCardBack.clickHandler);

	this.pairsCanvas.addChild(newCardBack, delayRedraw);
}

KanjiPairs.prototype.toggleCard = function(cardObject, cardMode) {
	for(var i = 0; i < cardObject.children.length; i++) {
		var currChild = cardObject.children[i];
		var targetOpacity = 0;
		switch(cardMode) {
			case 'flipped':
				targetOpacity = (currChild.visibleState === 'flipped' ? 1 : 0);
				break;
			case 'unflipped':
				targetOpacity = (currChild.visibleState === 'unflipped' ? 1 : 0);
				break;
			case 'both':
				targetOpacity = 1;
				break;
		}
		currChild.animate({opacity: targetOpacity}, {
			duration: 'short',
			easing: 'ease-in-out-quad'
		});
	}
}

KanjiPairs.prototype.layoutCards = function(numberOfCards) {
	var that = this;

	var kanjiSet = this.createKanjiSet(this.prunedReadingIndex, numberOfCards);
	var canvasElement = $('#' + this.canvasId);
	var canvasWidth = canvasElement.width();
	var canvasHeight = canvasElement.height();

	var xPos = 0;
	var yPos = 0;

	$.each(kanjiSet, function(index, currKanji) {
		that.addCard(currKanji, xPos, yPos, true);
		xPos += that.cardWidth + that.cardSpacing;
		if((xPos + that.cardWidth) > canvasWidth) {
			yPos += that.cardHeight + that.cardSpacing;
			xPos = 0;
		}
	});
	this.pairsCanvas.redraw();
}

$(document).ready(function() {
	kanjiPairs = new KanjiPairs(kanjiData, 'kanjipairs-main-canvas');

	kanjiPairs.layoutCards(44);
});
