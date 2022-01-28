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

const openDBConnection = (callback) => {
  MongoClient.connect(mongoUrl, async (err, client) => {
    if (err) {
      logger.error("DB connection error...");
      logger.error(err);
    } else {
      mongoClient = client;
      quizzerDatabase = await client.db(process.env["DBName"]);
      await quizzerDatabase.listCollections().forEach((collectionInfo) => {
        let collectionName = collectionInfo.name;
        collectionSet[collectionName] = quizzerDatabase.collection(collectionName);

        if (collectionName === "_Root") {
          // TODO : Some work
        } else if (collectionName !== "UserBase") {
          quizSet[collectionName] = {};
          collectionSet[collectionName].find().forEach((document) => {
            quizSet[collectionName][document["word"]] = document["meaning"];
          });
        }
      });

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
  closeDBConnection,
  getQuizSetVersion,
  getQuizSet,
  insertNewWord,
  saveUserData,
  getUserData,
  openDBConnection
};
