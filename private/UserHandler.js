"use strict";

const logger = global["globalLoggerObject"];
const {saveUserData, getUserData} = require('./DBHandler');
const {createHash} = require('crypto');
const uuid = require('uuid');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const jwt = require('jsonwebtoken');

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

let jwtSecretKey;
/**
 * Returns SHA256 hash of input data as hex string
 * @param data {any}
 * @return {string}
 */
const sha256 = (data) => {
  return createHash('sha256').update(data).digest('hex').toString().toUpperCase();
};
const generateJWTToken = (userMail) => {
  return jwt.sign({
    userMail,
    jwtSecretKey
  }, jwtSecretKey, {
    expiresIn: 10 * 60
  });
};
const verifyJWTToken = (jwtToken) => {
  let success = false, userMail = null, reason = null;
  try {
    let data = jwt.verify(jwtToken, jwtSecretKey);

    if (data["jwtSecretKey"] === jwtSecretKey) {
      success = true;
      userMail = data["userMail"];
    } else {
      reason = "Invalid Token";
    }
  } catch (err) {
    reason = err.toString();
  }

  return {
    success,
    reason,
    userMail
  };
};

const websiteURL = process.env["websiteURL"];
let mailVerificationCredentials;
let oAuth2Client;
const initializeUserHandler = (mVC) => {
  mailVerificationCredentials = mVC;
  jwtSecretKey = mVC["jwtSecret"];
  oAuth2Client = new google.auth.OAuth2(
    mVC["GOOGLE_CLIENT_ID"],
    mVC["GOOGLE_CLIENT_SECRET"],
    mVC["GOOGLE_REDIRECT_URI"]
  );
  oAuth2Client.setCredentials({"refresh_token": mVC["GOOGLE_REFRESH_TOKEN"]});
};
const sendVerificationEmail = async (userMail, jwtToken) => {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: 'OAuth2',
      user: mailVerificationCredentials["gmailAddress"],
      clientId: mailVerificationCredentials["GOOGLE_CLIENT_ID"],
      clientSecret: mailVerificationCredentials["GOOGLE_CLIENT_SECRET"],
      refreshToken: mailVerificationCredentials["GOOGLE_REFRESH_TOKEN"],
      accessToken: await oAuth2Client.getAccessToken()
    }
  });
  const verifyURL = websiteURL + "user/verify/" + jwtToken;

  const mailData = {
    from: "Quizzer Contact " + mailVerificationCredentials["gmailAddress"],
    to: userMail,
    subject: "Quizzer Account Verification",
    text: "Please click on the link below to verify your account. This link is only valid for 8 minutes.\n\n" +
      verifyURL,
    html: "<p>Please click on the button below to verify your account. This button is only valid for 8 minutes.</p><br><br>" +
      "<div style='width: 175px; height: 75px;'>" +
      "<a style='text-decoration: none;' href='" + verifyURL + "' target='_blank'>" +
      "<div style='border-radius: 15px; background: aqua; text-align: center; padding: 15px; width: fit-content; height: fit-content;'>" +
      "Verify Mail" +
      "</div>" +
      "</a>" +
      "</div>"
  };

  await transport.sendMail(mailData, () => {
  });
};

let adminSocketId = null;
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
    userMail,
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
    userMail,
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

const signingUpUsers = {};
const socketToUserMailMapping = new TwoWayMap({});
const signUpNewUser = async (userMail, password) => {
  let success = false, reason = null;
  if (signingUpUsers[userMail]) {
    reason = "Sign up already underway";
  } else {
    signingUpUsers[userMail] = true;
    let userData = await getUserData(userMail);
    if (userData == null || !userData["isMailVerified"]) {
      await saveUserData(userMail, {
        "passwordHash": sha256(password),
        "isMailVerified": false
      });

      let jwtToken = await generateJWTToken(userMail);
      sendVerificationEmail(userMail, jwtToken).then().catch((err) => {
        logger.error("Error when sending verification mail");
        logger.error(err);
      });

      success = true;
    } else {
      reason = "User Already Exists";
    }
    delete signingUpUsers[userMail];
  }

  return {
    success,
    reason
  };
};
const verifyNewUser = async (jwtToken) => {
  let success = false, reason = null;
  let verificationResult = verifyJWTToken(jwtToken);
  if (verificationResult["success"]) {
    let userMail = verificationResult["userMail"];
    let userDoc = await getUserData(userMail);

    if (userDoc == null || userMail == null) {
      reason = "No such user exists";
    } else if (userDoc["isMailVerified"]) {
      reason = "UserMail already verified";
    } else {
      await saveUserData(userMail.toString(), {
        "isMailVerified": true
      });
      success = true;
    }
  } else {
    reason = verificationResult["reason"];
  }

  return {
    success,
    reason
  };
};

module.exports = {
  initializeUserHandler,
  hasAdminPrivileges,
  logInUserFromSessionId,
  logInUserFromPassword,
  logOutUser,
  signUpNewUser,
  verifyNewUser
};
