'use strict';
const net = require('net');
const crypto = require('crypto');

module.exports = function makeWS(log) {
// ---------------------------------------------------------------- minimal WebSocket client
class MiniWS {
  constructor(port, handlers) {
    this.port = port;
    this.h = handlers;
    this.buf = Buffer.alloc(0);
    this.upgraded = false;
    this.frag = [];
  }

  connect() {
    const key = crypto.randomBytes(16).toString('base64');
    this.sock = net.connect(this.port, '127.0.0.1');
    this.sock.on('connect', () => {
      this.sock.write(
        `GET / HTTP/1.1\r\nHost: 127.0.0.1:${this.port}\r\nUpgrade: websocket\r\n` +
          `Connection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`
      );
    });
    this.sock.on('data', (d) => this._onData(d));
    this.sock.on('close', () => this.h.onClose && this.h.onClose());
    this.sock.on('error', (e) => log('socket error:', e.message));
  }

  _onData(d) {
    this.buf = Buffer.concat([this.buf, d]);
    if (!this.upgraded) {
      const i = this.buf.indexOf('\r\n\r\n');
      if (i < 0) return;
      const head = this.buf.slice(0, i).toString();
      if (!/^HTTP\/1\.1 101/.test(head)) {
        log('handshake failed:', head.split('\r\n')[0]);
        this.sock.destroy();
        return;
      }
      this.buf = this.buf.slice(i + 4);
      this.upgraded = true;
      this.h.onOpen && this.h.onOpen();
    }
    this._parse();
  }

  _parse() {
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0;
      const op = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f;
      let off = 2;
      if (len === 126) {
        if (b.length < 4) return;
        len = b.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (b.length < 10) return;
        len = Number(b.readBigUInt64BE(2));
        off = 10;
      }
      let mask = null;
      if (masked) {
        if (b.length < off + 4) return;
        mask = b.slice(off, off + 4);
        off += 4;
      }
      if (b.length < off + len) return;
      let payload = Buffer.from(b.slice(off, off + len));
      if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      this.buf = b.slice(off + len);

      if (op === 0x8) { this.sock.end(); return; }
      if (op === 0x9) { this._send(0xA, payload); continue; }
      if (op === 0xA) continue;
      this.frag.push(payload);
      if (fin) {
        const text = Buffer.concat(this.frag).toString('utf8');
        this.frag = [];
        try { this.h.onMessage && this.h.onMessage(text); } catch (e) { log('handler error:', e.stack || e.message); }
      }
    }
  }

  _send(op, payload) {
    const len = payload.length;
    let head;
    if (len < 126) head = Buffer.from([0x80 | op, 0x80 | len]);
    else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 0x80 | 126; head.writeUInt16BE(len, 2); }
    else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 0x80 | 127; head.writeBigUInt64BE(BigInt(len), 2); }
    const mask = crypto.randomBytes(4);
    const body = Buffer.from(payload);
    for (let i = 0; i < body.length; i++) body[i] ^= mask[i & 3];
    this.sock.write(Buffer.concat([head, mask, body]));
  }

  sendJSON(obj) { this._send(0x1, Buffer.from(JSON.stringify(obj), 'utf8')); }
}


return MiniWS;
};
