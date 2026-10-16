import { WebSocket, WebSocketServer } from 'ws';
import { Logger } from '../utils/logger';

export interface HandoffWebSocket extends WebSocket {
  isAlive: boolean;
}

/**
 * Creates a WebSocket server that broadcasts messages to connected clients.
 * Designed for development mode to help with hot-reloading.
 *
 * @param port - Optional port number for the WebSocket server; defaults to 3001.
 * @returns A function that accepts a message string and broadcasts it to all connected clients.
 */
export const createWebSocketServer = async (port: number = 3001) => {
  Logger.info(`Starting WebSocket server for live reload on port ${port}…`);

  const wss = new WebSocketServer({ port });

  wss.on('listening', () => {
    Logger.info(`WebSocket server listening on ws://localhost:${port} (live reload)`);
  });

  wss.on('error', (err) => {
    Logger.error(
      `WebSocket server failed${err instanceof Error ? `: ${err.message}` : ''}`,
      err instanceof Error ? err : undefined
    );
  });

  // Heartbeat function to mark a connection as alive.
  const heartbeat = function (this: HandoffWebSocket) {
    this.isAlive = true;
  };

  // Setup a new connection
  wss.on('connection', (ws) => {
    const extWs = ws as HandoffWebSocket;
    extWs.isAlive = true;
    extWs.send(JSON.stringify({ type: 'WELCOME' }));
    extWs.on('error', (error) => Logger.error('WebSocket client error:', error));
    extWs.on('pong', heartbeat);
  });

  // Periodically ping clients to ensure they are still connected
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const extWs = client as HandoffWebSocket;
      if (!extWs.isAlive) {
        Logger.debug('Terminating inactive WebSocket client');
        return client.terminate();
      }
      extWs.isAlive = false;
      client.ping();
    });
  }, 30000);

  // Clean up the interval when the server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  // Return a function to broadcast a message to all connected clients
  return (message: string) => {
    Logger.debug(`Broadcasting reload to ${wss.clients.size} WebSocket client(s)`);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
};
