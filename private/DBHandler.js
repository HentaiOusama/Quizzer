"use strict";

/**
 * @typedef {Object} UserDoc
 * @property {string} [passwordHash]
 * @property {boolean} [isMailVerified]
 * @property {string} [sessionIdHash]
 * @property {number} [maxSessionTime]
 * */

const logger = global["globalLoggerObject"];
const {MongoClient, Db, WithId} = require('mongodb');

const mongoUrl = "mongodb+srv://" + process.env["DBUsername"] + ":" + process.env["DBPassword"] + "@" +
  process.env["DBClusterName"].replace(/[ ]+/g, "").toLowerCase() + ".zm0r5.mongodb.net/" + process.env["DBName"];

/** @type MongoClient */
let mongoClient;
/** @type Db */
let quizzerDatabase;
/** @type Object.<string, Collection> */
let collectionSet = {};
/** @type Object.<string, Object.<string, string>> */
let quizSet = {};
let quizSetVersion = "0.0.0";

let mailVerificationCredentials;
const getMVC = () => {
  return mailVerificationCredentials;
};

const openDBConnection = (callback) => {
  MongoClient.connect(mongoUrl, async (err, client) => {
    if (err) {
      logger.error("DB connection error...");
      logger.error(err);
    } else {
      mongoClient = client;
      quizzerDatabase = await client.db(process.env["DBName"]);
      let collectionInfoList = await quizzerDatabase.listCollections().toArray();

      for (let collectionInfo of collectionInfoList) {
        let collectionName = collectionInfo.name;
        collectionSet[collectionName] = quizzerDatabase.collection(collectionName);

        if (collectionName === "_Root") {
          let mailVerificationDoc = await collectionSet[collectionName].findOne({"identifier": "mailVerification"});
          mailVerificationCredentials = {
            "jwtSecret": mailVerificationDoc["jwtSecret"],
            "gmailAddress": mailVerificationDoc["gmailAddress"],
            "GOOGLE_CLIENT_ID": mailVerificationDoc["GOOGLE_CLIENT_ID"],
            "GOOGLE_CLIENT_SECRET": mailVerificationDoc["GOOGLE_CLIENT_SECRET"],
            "GOOGLE_REDIRECT_URI": mailVerificationDoc["GOOGLE_REDIRECT_URI"],
            "GOOGLE_REFRESH_TOKEN": mailVerificationDoc["GOOGLE_REFRESH_TOKEN"]
          };
          Object.freeze(mailVerificationCredentials);

          // TODO : Do more work as necessary...
        } else if (collectionName !== "UserBase") {
          quizSet[collectionName] = {};
          await collectionSet[collectionName].find().forEach((document) => {
            quizSet[collectionName][document["word"]] = document["meaning"];
          });
        }
      }

      if (callback != null) {
        callback();
      }
    }
  });
};

const getQuizSetVersion = () => {
  return quizSetVersion;
};
const getQuizSet = () => {
  return quizSet;
};

/**
 * Function for inserting a new word in the database
 * @param collectionName {string} Collection to which the word belongs to.
 * @param word {string} Word that needs to be inserted.
 * @param meaning {string} Meaning of the specified word.
 */
const insertNewWord = async (collectionName, word, meaning) => {
  if (collectionSet[collectionName] == null) {
    collectionSet[collectionName] = quizzerDatabase.collection(collectionName);
    quizSet[collectionName] = {};
  }

  let existingMeaning = quizSet[collectionName][word];
  if (!existingMeaning) {
    existingMeaning = "";
  }
  if (existingMeaning.toLowerCase() !== meaning.toLowerCase()) {
    meaning = existingMeaning + " / " + meaning;
  }

  await collectionSet[collectionName].updateOne({word}, {"$set": {word, meaning}}, {
    "upsert": true
  });
  quizSet[collectionName][word] = meaning;
};

/**
 * Function to add / update information about user
 * @param userMail {string}
 * @param options {UserDoc}
 * @return {Promise<void>}
 */
const saveUserData = async (userMail, options) => {
  options["userMail"] = userMail;
  await collectionSet["UserBase"].updateOne({userMail}, {"$set": options}, {"upsert": true});
};

/**
 * Function to fetch user information from database.
 * @param userMail
 * @return {Promise<WithId | null>}
 */
const getUserData = async (userMail) => {
  return await collectionSet["UserBase"].findOne({userMail});
};

const closeDBConnection = () => {
  if (mongoClient != null) {
    mongoClient.close().then(() => {
      logger.info("DB Connection Closed");
    }).catch((err) => {
      logger.error("Error While Closing DB Connection");
      logger.error(err);
    });
  }
};

module.exports = {
  getMVC,
  openDBConnection,
  getQuizSetVersion,
  getQuizSet,
  insertNewWord,
  saveUserData,
  getUserData,
  closeDBConnection
};
