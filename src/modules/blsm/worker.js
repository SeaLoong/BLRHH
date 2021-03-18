

function stringToUint(s) {
  return Uint8Array.from((s ? s.split('') : []).map(v => v.charCodeAt(0)));
}

function uintToString(uintArray) {
  return decodeURIComponent(escape(String.fromCharCode.apply(null, uintArray)));
}


const BLSM = window.BLSM = {};

const ws = new WebSocket();
ws.binaryType = 'arraybuffer';

class PacketBuilder {
  buffer;
  dv;
  constructor() {
    this.buffer = new ArrayBuffer();
    this.dv = new DataView(this.buffer);
  }
  
  boolean () {}
  byte(){}
  short(){}

}

function onOpen (event) {

}

function onMessage (event) {

}

function onClose (event) {

}

function onError (event) {

}

function sendPacket (pid, procotol, seq, payload) {
  ws.send();
}

ws.onopen = onOpen;
ws.onmessage = onMessage;
ws.onclose = onClose;
ws.onerror = onError;
