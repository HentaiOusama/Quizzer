"use strict";

class TwoWayMap {
  constructor(keyMap) {
    if (typeof keyMap != "object") {
      throw "Parameter has to be a Map"
    }
    this.keyMap = keyMap;
    this.valueMap = {};
    for (const key in keyMap) {
      this.valueMap[keyMap[key]] = key;
    }
  }

  getValueFromKey(key) {
    return this.keyMap[key];
  }

  getKeyFromValue(value) {
    return this.valueMap[value];
  }

  setKeyAndValue(key, value) {
    this.unsetWithKey(key);
    this.unsetWithValue(value);
    this.keyMap[key] = value;
    this.valueMap[value] = key;
  }

  unsetWithKey(key) {
    if (key in this.keyMap) {
      delete this.valueMap[this.keyMap[key]]
      delete this.keyMap[key]
    }
  }

  unsetWithValue(value) {
    if (value in this.valueMap) {
      delete this.keyMap[this.valueMap[value]]
      delete this.valueMap[value]
    }
  }
}

module.exports = TwoWayMap;
