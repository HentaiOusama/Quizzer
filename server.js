"use strict";

const startTime = Date.now();

const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {service: 'user-service'},
  transports: [
    // - Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({filename: './Logs/jsLog.log'})
  ],
});

// If we're not in production then log to the `console` with the format: `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env["NODE_ENV"] !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
Object.freeze(logger);

// Putting it in global object so that it can be accessed from anywhere.
// This practice should be avoided and be used in cases only like this.
global["globalLoggerObject"] = logger;

const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const uuid = require('uuid');
const angularJson = require('./angular.json');

let portNumber = process.env["PORT"];
if (!portNumber) {
  portNumber = 6970;
}

const app = express();
const httpServer = http.createServer(app);
const outputFolder = __dirname + "/" + angularJson["projects"]["Quizzer"]["architect"]["build"]["options"]["outputPath"];

// Shutdown Handler
const shutdownHandler = (event) => {
  logger.info("Shutdown Handler Start for " + event);
  // TODO : Do something...

  setTimeout(() => {
    logger.info("Shutdown Handler End");
    process.exit(1);
  }, 25000);
};
if (process.stdin.isTTY && !process.stdin.isRaw) {
  process.stdin.setRawMode(true);
}
process.on("SIGINT", shutdownHandler);
process.on("SIGTERM", shutdownHandler);
process.stdin.resume();

const io = new Server(httpServer);

// --- SERVE NODE MODULES --- //
app.get('/node_modules/*.*', (req, res) => {
  try {
    res.status(200).sendFile(__dirname + req.path);
  } catch {
    res.sendStatus(404);
  }
});

// ---- SERVE STATIC FILES ---- //
app.get('*.*', express.static(outputFolder, {maxAge: '3d'}));

// ---- SERVE APPLICATION PATHS ---- //
app.all('*', function (req, res) {
  res.status(200).sendFile(`/`, {root: outputFolder});
});

let activeUsers = 0;

io.on('connection', (socket) => {
  activeUsers += 1;

  socket.on('disconnect', () => {
    activeUsers -= 1;
  });
});

const mongoUrl = "mongodb+srv://" + process.env["DBUsername"] + ":" + process.env["DBPassword"] + "@" +
  process.env["DBClusterName"].replace(/[ ]+/g, "").toLowerCase() + ".zm0r5.mongodb.net/" + process.env["DBName"];

mongoose.connect(mongoUrl, (err) => {
  if (err) {
    logger.info("DB connection error...");
    logger.error(err);
    return;
  }

  const endTime = Date.now();
  logger.info("Initialization Complete in " + (endTime - startTime) / 1000 + " seconds");

  httpServer.listen(portNumber, () => {
    logger.info('Listening on port ' + process.env.PORT);
  });
});
