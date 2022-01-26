"use strict";

const {saveUserData, getUserData} = require('./DBHandler');
const {createHash} = require('crypto');
const uuid = require('uuid');

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

/**
 * Returns SHA256 hash of input data as hex string
 * @param data {any}
 * @return {string}
 */
const sha256 = (data) => {
  return createHash('sha256').update(data).digest('hex').toString();
};

let adminSocketId = null;
const socketToUserMailMapping = new TwoWayMap({});

const hasAdminPrivileges = (socketId) => {
  return socketId === adminSocketId;
};

const logInUserFromSessionId = async (socketId, userMail, sessionId) => {
  let success = false, reason = null, newSessionId = null;
  const sessionIdHash = sha256(sessionId);
  const userDoc = await getUserData(userMail);

  if (userDoc == null || userDoc["sessionIdHash"] !== sessionIdHash) {
    reason = "Invalid Login Information";
  } else if (!userDoc["isMailVerified"]) {
    reason = "UserMail Unverified";
  } else if (Date.now() <= userDoc["maxSessionTime"]) {
    socketToUserMailMapping.setKeyAndValue(socketId, userMail);
    if (userDoc["isAdmin"]) {
      adminSocketId = socketId;
    }

    success = true;
    newSessionId = uuid.v4() + "-" + uuid.v4();
    await saveUserData(userMail, {"sessionIdHash": sha256(newSessionId)});
  } else {
    reason = "Session Expired";
  }

  return {
    success,
    reason,
    newSessionId
  };
};
const logInUserFromPassword = async (socketId, userMail, password, createSessionId = false) => {
  let success = false, reason = null, newSessionId = null;
  const passwordHash = sha256(password);
  const userDoc = await getUserData(userMail);

  if (userDoc == null || userDoc["passwordHash"] !== passwordHash) {
    reason = "Invalid UserMail / Password";
  } else if (!userDoc["isMailVerified"]) {
    reason = "UserMail Unverified";
  } else {
    socketToUserMailMapping.setKeyAndValue(socketId, userMail);
    if (userDoc["isAdmin"]) {
      adminSocketId = socketId;
    }

    success = true;
    if (createSessionId) {
      newSessionId = uuid.v4() + "-" + uuid.v4();
      await saveUserData(userMail, {
        "sessionIdHash": sha256(newSessionId),
        "maxSessionTime": (Date.now() + (10 * 24 * 60 * 60 * 1000))
      });
    }
  }

  return {
    success,
    reason,
    newSessionId
  };
};
const logOutUser = (socketId) => {
  if (socketId === adminSocketId) {
    adminSocketId = null;
  }
  socketToUserMailMapping.unsetWithKey(socketId);
};

// TODO :  Complete below functions
const signUpNewUser = () => {
};
const verifyNewUser = () => {
};

module.exports = {
  hasAdminPrivileges,
  logInUserFromSessionId,
  logInUserFromPassword,
  logOutUser,
  signUpNewUser,
  verifyNewUser
};
