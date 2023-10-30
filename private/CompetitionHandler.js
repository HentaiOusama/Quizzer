"use strict";

const logger = global["globalLoggerObject"];
const TwoWayMap = require("./TwoWayMap");

const roomIdToPlayersCollection = {}
const playerAddressToGameIdMap = new TwoWayMap({});
const socketIdToPlayerAddressMap = new TwoWayMap({});

const putPlayerInRoomCollection = (playerAddress, roomId) => {
  let collection = roomIdToPlayersCollection[roomId];
  if (collection) {
    collection.push(playerAddress);
  } else {
    collection = [playerAddress];
    roomIdToPlayersCollection[roomId] = collection;
  }
};

const addPlayerToRoom = (socketId, playerAddress, roomId) => {
  if (playerAddressToGameIdMap.getValueFromKey(playerAddress) === roomId) {
    socketIdToPlayerAddressMap.setKeyAndValue(socketId, playerAddress);
    putPlayerInRoomCollection(playerAddress, roomId);
    return true;
  } else {
    return false;
  }
};

const getAllPlayersInRoom = (roomId) => {
  let collection = roomIdToPlayersCollection[roomId];
  return (collection) ? collection : null;
};

module.exports = {
  addPlayerToRoom,
  getAllPlayersInRoom
};
