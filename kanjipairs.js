KanjiPairs = function(kanjiData, numberOfCards) {
	var that = this;
	this.numberOfCards = numberOfCards;

	//presets
	this.cardWidth = 100;
	this.cardHeight = 135;
	this.cardSpacing = 10;
	this.cardFill = {red: 0, green: 0, blue: 255};
	this.altCardFills = [
		{red: 0, green: 160, blue: 255},
		{red: 0, green: 224, blue: 255},
		{red: 160, green: 0, blue: 255},
		{red: 160, green: 160, blue: 255},
		{red: 0, green: 160, blue: 0},
		{red: 0, green: 224, blue: 0}
	];
	this.kanjiAlternateFills = {};
	this.matchedCardFill = 'black';
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

	this.canvasId = $('[kanjipairs-control=main-canvas]').prop('id');
	this.pairsCanvas = this.initializeCanvas();

	this.flipBackTimeout = this.getSetting('flipBackTimeout') || 2;

	this.timeoutSliderSettings = {
		range: "min",
		min: 1,
		max: 10,
		value: this.flipBackTimeout,
		step: 0.5
	};

	this.autoShuffleControlName = 'auto-shuffle-selection';
	this.autoShuffleControlSelector = '[kanjipairs-control=' + this.autoShuffleControlName + ']';

	this.filtersList = [
		'grade-level-filter',
		'jlpt-filter',
		this.autoShuffleControlName
	];

	this.normalizeReadings = true;
	this.preventDuplicates = true;

	this.usedReadings = [];

	this.baseKanjiData = kanjiData;

	this.initializeDataSet(this.baseKanjiData);

	this.flippedCards = [];

	this.initializeControls();
};

KanjiPairs.prototype.katakanaToHiragana = function(stringWithKatakana) {
	var hiraganaString = stringWithKatakana.replace(/[ァ-ン]/g, function(s) {
		return String.fromCharCode(s.charCodeAt(0) - 0x60);
	});

	return hiraganaString;
}

KanjiPairs.prototype.hiraganaToKatakana = function(stringWithHiragana) {
	var katakanaString = stringWithHiragana.replace(/[ぁ-ん]/g, function(s) {
		return String.fromCharCode(s.charCodeAt(0) + 0x60);
	});

	return katakanaString;
}

KanjiPairs.prototype.normalizeReading = function(readingToNormalize) {
	return this.katakanaToHiragana(readingToNormalize);
}

KanjiPairs.prototype.initializeCanvas = function(canvasId) {
	return oCanvas.create({
		canvas: '#' + this.canvasId,
		background: 'white'
	});
}

KanjiPairs.prototype.initializeDataSet = function(kanjiSet) {
	this.kanjiData = kanjiSet;
	var indexResults = this.indexReadings(this.kanjiData);
	this.indexedReadings = indexResults.indexedReadings;
	this.readingNormalizations = indexResults.readingNormalizations;
	this.prunedReadingIndex = this.pruneIndexedReadings(this.indexedReadings, 2);
}

KanjiPairs.prototype.loadFilterSettings = function(controlName) {
	var filterSettingsString = this.getSetting(controlName);
	if(typeof filterSettingsString !== 'undefined') {
		var filterSettings = JSON.parse(filterSettingsString);
		var filterItems = $('[kanjipairs-control=' + controlName + '] input');
		filterItems.each(function(index, el) {
			if($.inArray($(el).val(), filterSettings) !== -1) {
				$(el).prop('checked', true);
			}
		});
	}
}

KanjiPairs.prototype.saveFilterSettings = function(controlName) {
	if(this.localStorageSupported()) {
		var filterSettings = this.getFilters();
		if(filterSettings.hasOwnProperty(controlName)) {
			var filterSettingsString = JSON.stringify(filterSettings[controlName]);
			this.saveSetting(controlName, filterSettingsString);
		}
	}
}

KanjiPairs.prototype.getFilters = function() {
	var that = this;
	var returnVals = {};

	$.each(this.filtersList, function(index, filterName) {
		returnVals[filterName] = that.grabCheckListFilterVals(filterName);
	});

	return returnVals;
}

KanjiPairs.prototype.grabCheckListFilterVals = function(controlName) {
	var returnVals = [];
	var checkedItems = $('[kanjipairs-control=' + controlName + '] input:checked');
	checkedItems.each(function(index, el) {
		returnVals.push($(el).val());
	});

	return returnVals;
}

KanjiPairs.prototype.filterKanjiSet = function() {
	var filterSet = this.getFilters();
	var filteredKanjiSet = [];

	var hasFilters = false;
	$.each(filterSet, function(index, val) {
		hasFilters = hasFilters || val.length;
		if(hasFilters) {
			return false; //break out of the loop
		}
	});

	if(hasFilters) {
		$.each(this.baseKanjiData, function(index, kanjiCharacter) {
			var charIncluded = true;

			if(filterSet['grade-level-filter'].length) {
				var currGrade = ($.isNumeric(kanjiCharacter.miscMetaData.grade) ? kanjiCharacter.miscMetaData.grade : 0);
				charIncluded = charIncluded && ($.inArray(currGrade.toString(), filterSet['grade-level-filter']) !== -1);
			}

			if(filterSet['jlpt-filter'].length) {
				var currJlptLevel = ($.isNumeric(kanjiCharacter.miscMetaData.jlpt) ? kanjiCharacter.miscMetaData.jlpt : 0);
				charIncluded = charIncluded && ($.inArray(currJlptLevel.toString(), filterSet['jlpt-filter']) !== -1);
			}

			if(charIncluded) {
				filteredKanjiSet.push(kanjiCharacter);
			}
		});
	}
	else {
		filteredKanjiSet = this.baseKanjiData;
	}

	this.initializeDataSet(filteredKanjiSet);
}

KanjiPairs.prototype.indexReadings = function(characterReadings) {
	var that = this;
	var indexedReadings = {};
	var readingNormalizations = {};
	$.each(characterReadings, function(index, currChar) {
		var characterIndex = index;
		$.each(currChar.readings, function(index, currReading) {
			if(that.normalizeReadings) {
				var normalizedReading = that.normalizeReading(currReading.readingText);
			}
			else {
				var normalizedReading = currReading.readingText;
			}
			if(!indexedReadings.hasOwnProperty(normalizedReading)) {
				indexedReadings[normalizedReading] = [];
			}
			indexedReadings[normalizedReading].push(characterIndex);
			if(currReading.readingText != normalizedReading) {
				//assigns readingNormalizations[characterIndex] to itself, if defined. Otherwise, sets it to a new object
				readingNormalizations[characterIndex] = readingNormalizations[characterIndex] || {};
				readingNormalizations[characterIndex][normalizedReading] = currReading.readingText;
			}
		});
	});

	return {indexedReadings: indexedReadings, readingNormalizations: readingNormalizations};
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

	if(this.usedReadings.length >= readingKeys.length) {
		return null;
	}
	else {
		//The bit shift (<<) is shorthand that truncates the value to an integer value
		var randomIndex = readingKeys[readingKeys.length * Math.random() << 0];
		this.usedReadings.push(randomIndex);
		return randomIndex;
	}
}

KanjiPairs.prototype.pickRandomReadings = function(indexedReadings, numberOfReadings) {
	var readingKeys = Object.keys(indexedReadings);
	var readingPicks = [];

	if(numberOfReadings >= readingKeys.length) {
		readingPicks = readingKeys;
	}
	else {
		for(var i = 0; i < numberOfReadings;) {
			//The bit shift (<<) is shorthand that truncates the value to an integer value
			var randomIndex = readingKeys[readingKeys.length * Math.random() << 0];
			if($.inArray(randomIndex, readingPicks) === -1) {
				readingPicks.push(randomIndex);
				this.usedReadings.push(randomIndex);
				i++;
			}
		}

	}

	return readingPicks;
}

KanjiPairs.prototype.createKanjiSet = function(indexedReadings, numberOfKanji) {
	var that = this;

	//Can't produce more kanji than we have in our (possibly filtered) set
	numberOfKanji = (numberOfKanji > this.kanjiData.length ? this.kanjiData.length : numberOfKanji);

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

	//sanity check, for when we have an empty filtered set or a filtered set with only one kanji
	if(numberOfKanji > this.kanjiData.length) {
		return; //exit the function w/o creating any kanji
	}

	//Grab enough readings for half the number of kanji (as each pair of kanji must share a reading)
	var randomReadings = this.pickRandomReadings(indexedReadings, numberOfKanji / 2);

	var kanjiArray = [];

	for(var currentReadingIndex = 0; currentReadingIndex < numberOfKanji / 2;) {
		//Get random kanji from this loop's reading
		var currReading = randomReadings[currentReadingIndex];
		var currReadingKanjiFull = indexedReadings[currReading];

		var numKanjiForReading = 0;
		var currReadingKanji = [];

		if(that.preventDuplicates) {
			//Filter out kanji that have already been added
			$.each(currReadingKanjiFull, function(index, currKanji) {
				if(!that.checkForKanji(kanjiArray, {kanjiIndex: currKanji})) {
					currReadingKanji.push(currKanji);
				}
			});
		}
		else {
			currReadingKanji = currReadingKanjiFull;
		}

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
					if(this.readingNormalizations.hasOwnProperty(kanjiItem.kanjiIndex) && this.readingNormalizations[kanjiItem.kanjiIndex].hasOwnProperty(kanjiItem.selectedReading)) {
						kanjiItem.selectedReading = this.readingNormalizations[kanjiItem.kanjiIndex][kanjiItem.selectedReading];
					}

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
			var newRandomReading = this.pickRandomReading(indexedReadings);
			if(newRandomReading === null) {
				//we ran out of new readings, continue to the next reading
				currentReadingIndex++;
			}
			else {
				randomReadings[currentReadingIndex] = newRandomReading;
			}
		}
	}

	return kanjiArray;
}

KanjiPairs.prototype.checkForKanji = function(kanjiArray, kanjiItem) {
	var that = this;
	var matchFound = false;
	$.each(kanjiArray, function checkEachElementForKanji(index, val) {
		if(typeof val !== 'undefined') {
			var kanjiMatch = false;
			if(that.preventDuplicates) {
				kanjiMatch = (val.kanjiIndex == kanjiItem.kanjiIndex);
			}
			else {
				var valReading = that.normalizeReadings ? that.normalizeReading(val.selectedReading) : val.selectedReading;
				var itemReading = that.normalizeReadings ? that.normalizeReading(kanjiItem.selectedReading) : kanjiItem.selectedReading;
				kanjiMatch = (val.kanjiIndex == kanjiItem.kanjiIndex && valReading == itemReading);
			}

			if(kanjiMatch) {
				matchFound = true;
				return false; //return false breaks us out of the .each() loop
			}
		}
	});

	return matchFound;
}

KanjiPairs.prototype.getFillForKanji = function(kanjiIndex) {
	var that = this;
	var numAltFills = this.altCardFills.length;
	var kanjiFill = this.cardFill;
	if(this.kanjiAlternateFills.hasOwnProperty(kanjiIndex)) {
		var cardFillsIndex = (this.kanjiAlternateFills[kanjiIndex] % numAltFills) - 1;
		var kanjiFill = this.altCardFills[cardFillsIndex];
		this.kanjiAlternateFills[kanjiIndex] += 1;
	}
	else {
		this.kanjiAlternateFills[kanjiIndex] = 1;
	}

	return kanjiFill;
}

KanjiPairs.prototype.addCard = function(kanjiItem, xPos, yPos, delayRedraw) {
	var that = this;
	var cardFillVals = this.getFillForKanji(kanjiItem.kanjiIndex);
	var cardFillString = 'rgb(' + cardFillVals.red + ', ' + cardFillVals.green + ', ' + cardFillVals.blue + ')';
	var newCardBack = this.pairsCanvas.display.rectangle({
		x: xPos,
		y: yPos,
		width: this.cardWidth,
		height: this.cardHeight,
		fill: cardFillString,
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
					var firstCard = that.flippedCards[0];
					var secondCard = this;

					if(that.normalizeReadings) {
						var firstCardReading = that.normalizeReading(firstCard.kanjiItem.selectedReading);
						var secondCardReading = that.normalizeReading(secondCard.kanjiItem.selectedReading);
					}
					else {
						var firstCardReading = firstCard.kanjiItem.selectedReading;
						var secondCardReading = secondCard.kanjiItem.selectedReading;
					}

					if(firstCardReading == secondCardReading) {
						firstCard.unbind('click tap', firstCard.clickHandler);
						secondCard.unbind('click tap', secondCard.clickHandler);
						firstCard.fill = that.matchedCardFill;
						that.toggleCard(firstCard, 'both');
						secondCard.fill = that.matchedCardFill;
						that.toggleCard(secondCard, 'both');
						secondCard.matchedCard = true;
						firstCard.matchedCard = true;
						var autoShuffleSetting = $(that.autoShuffleControlSelector).find('input:checked');
						if(autoShuffleSetting.length && autoShuffleSetting.val() == 'attempt') {
							that.shuffleCards();
						}
					}
					else {
						(function(firstCard, secondCard, kanjiPairsObj){
							setTimeout(function(){
								kanjiPairsObj.toggleCard(firstCard, 'unflipped');
								firstCard.flipped = false;
								kanjiPairsObj.toggleCard(secondCard, 'unflipped');
								secondCard.flipped = false;
								var autoShuffleSetting = $(that.autoShuffleControlSelector).find('input:checked');
								if(autoShuffleSetting.length && autoShuffleSetting.val() == 'attempt') {
									that.shuffleCards();
								}
							}, kanjiPairsObj.flipBackTimeout * 1000);
						})(firstCard, secondCard, that);
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
		//If we ran out of readings/cards before the array was filled, there will be undefined elements
		if(typeof currKanji !== 'undefined') {
			that.addCard(currKanji, xPos, yPos, true);
			xPos += that.cardWidth + that.cardSpacing;
			if((xPos + that.cardWidth) > canvasWidth) {
				yPos += that.cardHeight + that.cardSpacing;
				xPos = 0;
			}
		}
	});
	this.pairsCanvas.redraw();
}

KanjiPairs.prototype.shuffleCards = function() {
	var that = this;

	//make a copy of the children array to iterate over
	var cardsArray = that.pairsCanvas.children.slice(0);

	var canvasElement = $('#' + this.canvasId);
	var canvasWidth = canvasElement.width();
	var canvasHeight = canvasElement.height();

	var shuffledArray = that.shuffleArray(cardsArray);

	$.each(cardsArray, function(index, currCard) {
		currCard.remove(false);
	});

	that.pairsCanvas.redraw();

	var xPos = 0;
	var yPos = 0;

	$.each(shuffledArray, function(index, currCard) {
		currCard.x = xPos;
		currCard.y = yPos;
		that.pairsCanvas.addChild(currCard, false);

		xPos += that.cardWidth + that.cardSpacing;
		if((xPos + that.cardWidth) > canvasWidth) {
			yPos += that.cardHeight + that.cardSpacing;
			xPos = 0;
		}
	});

	//If there are any flipped cards, make sure they display as flipped after the shuffle
	$.each(that.flippedCards, function(index, currCard) {
		//except if it has already been matched
		if(!currCard.hasOwnProperty('matchedCard') && currCard.matchedCard) {
			that.toggleCard(currCard, 'flipped');
		}
	});

	that.pairsCanvas.redraw();
}

KanjiPairs.prototype.shuffleArray = function(arrayToShuffle) {
	var shuffledArray = arrayToShuffle.slice(0);
	for (var currIndex = shuffledArray.length - 1; currIndex > 0; currIndex--) {
		var swapIndex = Math.floor(Math.random() * (currIndex + 1));

		var temp = shuffledArray[currIndex];
		shuffledArray[currIndex] = shuffledArray[swapIndex];
		shuffledArray[swapIndex] = temp;
	}
	return shuffledArray;
}

KanjiPairs.prototype.clearAllCards = function() {
	while(this.flippedCards.length) {
		this.flippedCards.pop();
	}
	this.pairsCanvas.destroy();
	this.pairsCanvas = this.initializeCanvas(this.canvasId);
}

KanjiPairs.prototype.initializeTimeoutSlider = function(timeoutSliderSettings) {
	var that = this;
	var displayInputSelector = '[kanjipairs-control=timeout-slider-display]';
	var sliderSelector = '[kanjipairs-control=timeout-slider]';

	var newSliderSettings = 
		$.extend({
			slide: function(event, ui) {
				$(displayInputSelector).val(ui.value);
				that.flipBackTimeout = ui.value;
				that.saveSetting('flipBackTimeout', ui.value);
			}
		}, timeoutSliderSettings);

	$(sliderSelector).slider(newSliderSettings);
	$(displayInputSelector).val($(sliderSelector).slider("value"));
}

KanjiPairs.prototype.initializeControls = function() {
	var that = this;
	this.initializeTimeoutSlider(this.timeoutSliderSettings);

	$('[kanjipairs-control=new-set-button]').click(function(event) {
		that.newCardSet();
		$.each(that.filtersList, function(index, filterName) {
			that.saveFilterSettings(filterName);
		});
	});

	$('[kanjipairs-control=shuffle-button]').click(function(event) {
		that.shuffleCards();
	});

	$.each(this.filtersList, function(index, filterName) {
		that.loadFilterSettings(filterName);
	});

	var autoShuffleControl = $(this.autoShuffleControlSelector);

	autoShuffleControl.change(function(event) {
		that.saveFilterSettings(that.autoShuffleControlName);
	});

	if(!autoShuffleControl.find('input:checked').length) {
		autoShuffleControl.find('input[value=off]').prop('checked', 'true');
	}

	$('[kanjipairs-control=filter-controls]').dialog({
		autoOpen: false,
		modal: true,
		width: 700
	});

	$('[kanjipairs-control=show-filters-button]').on('click', function(event) {
		$('[kanjipairs-control=filter-controls]').dialog('open');
	});

	$('[kanjipairs-control=settings-controls]').dialog({
		autoOpen: false,
		modal: true,
		width: 700
	});

	$('[kanjipairs-control=show-settings-button]').on('click', function(event) {
		$('[kanjipairs-control=settings-controls]').dialog('open');
	});

	$('[kanjipairs-control=about-kanjipairs]').dialog({
		autoOpen: false,
		modal: true,
		width: 700
	});

	$('[kanjipairs-control=about-kanjipairs-button]').on('click', function(event) {
		$('[kanjipairs-control=about-kanjipairs]').dialog('open');
	});

}

KanjiPairs.prototype.newCardSet = function() {
	this.usedReadings.length = 0;
	this.kanjiAlternateFills = {};
	this.clearAllCards();
	this.filterKanjiSet();
	this.layoutCards(this.numberOfCards);
}

KanjiPairs.prototype.localStorageSupported = function() {
	try {
		return('localStorage' in window && window['localStorage'] !== null);
	}
	catch(e) {
		return false;
	}
}

KanjiPairs.prototype.saveSetting = function(settingName, settingValue) {
	if(this.localStorageSupported()) {
		return localStorage.setItem(settingName, settingValue);
	}
}

KanjiPairs.prototype.getSetting = function(settingName) {
	if(this.localStorageSupported()) {
		return localStorage.getItem(settingName);
	}
	else {
		return undefined;
	}
}

$(document).ready(function() {
	kanjiPairs = new KanjiPairs(kanjiData, 44);

	kanjiPairs.newCardSet();
});
