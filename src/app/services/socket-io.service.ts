import {io} from 'socket.io-client';

export abstract class SocketIOService {
  private static defaultPort: number = 6970;
  static socket = io((window.location.origin.match(/http:\/\/localhost:.*/)) ?
    "http://localhost:" + SocketIOService.defaultPort + "/" :
    window.location.origin, {
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
