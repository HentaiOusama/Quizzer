"use strict";

const fs = require('fs');

const getWordMeaningArray = () => {
  let allWordMeanings = fs.readFileSync(__dirname + "\\WordMeaningList.txt").toString().split(/[\n\r]+/gi);
  let output = [];
  for (let element of allWordMeanings) {
    let splitResult = element.trim().split(" # ");
    if ((splitResult.length === 2) && splitResult[0] && splitResult[1]) {
      output.push({
        "word": splitResult[0],
        "meaning": splitResult[1]
      });
    } else {
      console.log("Error for word ->" + element + "<-. Unable to process.");
    }
  }

  return output;
};

module.exports = {
  getWordMeaningArray
};
