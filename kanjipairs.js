KanjiPairs = function(xmlKanjiData) {
	var that = this;
	var kanjiData = xmlKanjiData;
	this.kanjiData = kanjiData;
	var readings = this.extractReadings(kanjiData);
	this.readings = readings;
};

KanjiPairs.prototype.extractReadings = function(xmlKanjiData) {
	var kanjiData = $(xmlKanjiData);
	var characters = kanjiData.find('character');
	var extractedChars = [];
	characters.each(function(index, el) {
		var currChar = {};
		currChar.literal = $(el).find('literal').text();
		var currReadings = [];
		var onKunReadings = $(el).find('reading[r_type="ja_on"], reading[r_type="ja_kun"]');
		onKunReadings.each(function(index, el) {
			var newReading = {
				readingType: ($(el).attr('r_type') === 'ja_on' ? 'On' : 'Kun'),
				readingText: $(el).text()
			};
			currReadings.push(newReading)
		});
		var nameReadings = $(el).find('nanori');
		nameReadings.each(function(index, el) {
			var newReading = {
				readingType: 'Name',
				readingText: $(el).text()
			};
			currReadings.push(newReading);
		});
		currChar.readings = currReadings;
		extractedChars.push(currChar);
	});

	return extractedChars;
};


$(document).ready(function() {
	var kanjiData = $.parseXML($('#kanjidata').text());

	kanjiPairs = new KanjiPairs(kanjiData);

	0;
});
