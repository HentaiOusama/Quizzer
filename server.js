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

const {
  closeDBConnection,
  getQuizSetVersion,
  getQuizSet,
  insertNewWord,
  openDBConnection
} = require('./private/DBHandler');
const {
  hasAdminPrivileges,
  logInUserFromSessionId,
  logInUserFromPassword,
  logOutUser, signUpNewUser
} = require('./private/UserHandler');
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
  closeDBConnection();

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
const validateUserMail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i
    )[0];
};

io.on('connection', (socket) => {
  activeUsers += 1;

  socket.on('userLogin', async (credentials) => {
    try {
      credentials["userMail"] = validateUserMail(credentials["userMail"]);
      let result;
      if (typeof credentials["sessionId"] === "string") {
        result = await logInUserFromSessionId(socket.id, credentials["userMail"], credentials["sessionId"]);
      } else if (typeof credentials["password"] === "string") {
        result = await logInUserFromPassword(socket.id, credentials["userMail"], credentials["password"], credentials["rememberMe"] === true);
      }

      if (result["success"]) {
        socket.emit('loginSuccess', result);

        if (hasAdminPrivileges(socket.id)) {
          socket.emit('adminPrivilegeGranted');
        }
      } else {
        socket.emit('loginUnsuccessful', result["reason"]);
      }
    } catch {
      socket.emit("loginUnsuccessful", "Invalid UserMail");
    }
  });

  socket.on('userSignup', async (credentials) => {
    try {
      credentials["userMail"] = validateUserMail(credentials["userMail"]);
      if (typeof credentials["password"] === "string") {
        let result = await signUpNewUser(credentials["userMail"], credentials["password"]);

        if (result["success"]) {
          socket.emit("signupSuccess");
        } else {
          socket.emit("signupUnsuccessful", result["reason"]);
        }
      }
    } catch {
      socket.emit("signupUnsuccessful", "Invalid UserMail");
    }
  });

  socket.on('userVerification', () => {
    // TODO : Complete this...
  });

  socket.on('addNewWord', (data) => {
    if (hasAdminPrivileges(socket.id)) {
      if (typeof data["collectionName"] === "string" && typeof data["word"] === "string" && typeof data["meaning"] === "string") {
        insertNewWord(data["collectionName"], data["word"], data["meaning"]).then(() => {
          socket.emit('addWordSuccess', data);
        }).catch(() => {
          socket.emit('addWordFailure', data);
        });
      }
    }
  });

  socket.on('sendLatestQuizSetVersion', () => {
    socket.emit('latestQuizSetVersion', getQuizSetVersion());
  });

  socket.on('sendQuizSet', () => {
    socket.emit('latestQuizSet', {
      "quizSetVersion": getQuizSetVersion(),
      "quizSet": getQuizSet()
    });
  });

  socket.on('disconnect', () => {
    activeUsers -= 1;
    logOutUser(socket.id);
  });
});

openDBConnection(() => {
  const endTime = Date.now();
  logger.info("Initialization Complete in " + (endTime - startTime) / 1000 + " seconds");

  httpServer.listen(portNumber, () => {
    logger.info('Listening on port ' + process.env.PORT);
  });
});
