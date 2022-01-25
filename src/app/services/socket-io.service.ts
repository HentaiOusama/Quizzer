import {io} from 'socket.io-client';

export abstract class SocketIOService {
  static socket = io(window.location.origin, {
    'reconnectionDelay': 2500,
    "reconnectionAttempts": 100
  });

  static setActionForEvent = (eventName: string, callback: (...args: any) => any) => {
    SocketIOService.socket.on(eventName, callback);
  };

  static emitEventToServer = (eventName: string, data: any) => {
    SocketIOService.socket.emit(eventName, data);
  };
}
