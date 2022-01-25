"use strict";

const startTime = Date.now();

const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {service: 'user-service'},
  transports: [
    // - Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({filename: './logs/jsLog.log', options: {flags: "w"}})
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

const DBHandler = require('./private/DBHandler');
const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
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
  DBHandler.closeDBConnection();

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
let adminSocketId;
let loggedInUsers = {};

io.on('connection', (socket) => {
  activeUsers += 1;

  socket.on('userLogin', (credentials) => {
    if (typeof credentials["username"] === "string") {
      // TODO : Fill below stuff

      if (typeof credentials["sessionId"] === "string") {

      } else if (typeof credentials["password"] === "string") {

      }
    }
  });

  socket.on('addNewWord', (data) => {
    if (socket.id === adminSocketId) {
      if (typeof data["collectionName"] === "string" && typeof data["word"] === "string" && typeof data["meaning"] === "string") {
        DBHandler.insertNewWord(data["collectionName"], data["word"], data["meaning"]).then(() => {
          socket.emit('addWordSuccess', data);
        }).catch(() => {
          socket.emit('addWordFailure', data);
        });
      }
    }
  });

  socket.on('sendLatestQuizSetVersion', () => {
    socket.emit('latestQuizSetVersion', DBHandler.getQuizSetVersion());
  });

  socket.on('sendQuizSet', () => {
    socket.emit('latestQuizSet', {
      "quizSetVersion": DBHandler.getQuizSetVersion(),
      "quizSet": DBHandler.getQuizSet()
    });
  });

  socket.on('disconnect', () => {
    activeUsers -= 1;
    if (socket.id === adminSocketId) {
      adminSocketId = null;
    }
  });
});

DBHandler.openDBConnection(() => {
  const endTime = Date.now();
  logger.info("Initialization Complete in " + (endTime - startTime) / 1000 + " seconds");

  httpServer.listen(portNumber, () => {
    logger.info('Listening on port ' + process.env.PORT);
  });
});
