import Peer, { DataConnection } from 'peerjs';
import { PeerMessage } from '../types';

type DataListener = (data: PeerMessage) => void;

export class PeerService {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private myId: string = '';
  private listeners: DataListener[] = [];

  constructor() {}

  async initialize(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer();

      this.peer.on('open', (id) => {
        this.myId = id;
        resolve(id);
      });

      this.peer.on('error', (err) => {
        reject(err);
      });
    });
  }

  // Register a listener for incoming data
  addMessageListener(listener: DataListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private handleData(data: PeerMessage) {
    this.listeners.forEach(l => l(data));
  }

  hostGame(onConnection: () => void) {
    if (!this.peer) return;

    this.peer.on('connection', (conn) => {
      this.conn = conn;
      conn.on('open', () => {
        onConnection();
      });
      conn.on('data', (data) => {
        this.handleData(data as PeerMessage);
      });
    });
  }

  joinGame(hostId: string, onOpen: () => void) {
    if (!this.peer) return;

    this.conn = this.peer.connect(hostId);
    
    this.conn.on('open', () => {
      onOpen();
    });

    this.conn.on('data', (data) => {
      this.handleData(data as PeerMessage);
    });
  }

  send(data: PeerMessage) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  cleanup() {
    if (this.conn) this.conn.close();
    if (this.peer) this.peer.destroy();
    this.conn = null;
    this.peer = null;
    this.listeners = [];
  }

  getId() {
    return this.myId;
  }
}

export const peerService = new PeerService();
