// Based on code from http://derpturkey.com/extending-tcp-socket-in-node-js/

const { Socket } = require('net');
const { Duplex } = require('stream');

const mp = require('./mrcp_parser.js')

class MrcpSocket extends Duplex {
  /**
   MrcpSocket gives basic stream support for MRCP protocol.

   @param {Socket} socket
   */
  constructor(socket, server_mode) {
    super({ objectMode: true });

    /**
      True when read buffer is full and calls to `push` return false.
      Additionally data will not be read off the socket until the user
      calls `read`.
      @private
      @type {boolean}
     */
    this._readingPaused = false;

    /**
      The underlying TCP Socket
      @private
      @type {Socket}
     */
    this._socket;
	this._server_mode = server_mode;

    // wrap the socket
    if (socket) this._wrapSocket(socket);
  }

  /**
    Connect to an MrcpSocket server.
    @param {object} param
    @param {string} [param.host] the host to connect to. Default is localhost
    @param {number} param.port the port to connect to. Required.
    @return {MrcpSocket}
   */
  connect({ host, port }) {
    this._wrapSocket(new Socket());
    this._socket.connect({ host, port });
    return this;
  }

  /**
    Wraps a standard TCP Socket by binding to all events and either
    rebroadcasting those events or performing custom functionality.

    @private
    @param {Socket} socket
   */
  _wrapSocket(socket) {
    this._socket = socket;
    this._socket.on('close', hadError => this.emit('close', hadError));
    this._socket.on('connect', () => this.emit('connect'));
    this._socket.on('drain', () => this.emit('drain'));
    this._socket.on('end', () => this.emit('end'));
    this._socket.on('error', err => this.emit('error', err));
    this._socket.on('lookup', (err, address, family, host) => this.emit('lookup', err, address, family, host)); // prettier-ignore
    this._socket.on('ready', () => this.emit('ready'));
    this._socket.on('timeout', () => this.emit('timeout'));
    this._socket.on('readable', this._onReadable.bind(this));
  }

  /**
    Performs data read events which are triggered under two conditions:
    1. underlying `readable` events emitted when there is new data
       available on the socket
    2. the consumer requested additional data
    @private
   */
  _onReadable() {
    // Read all the data until one of two conditions is met
    // 1. there is nothing left to read on the socket
    // 2. reading is paused because the consumer is slow
    while (!this._readingPaused) {
      // First step is finding the message length which is the second token in the start-line
	  let minimum_bytes = 32
      let buf = this._socket.read(minimum_bytes)
      if (!buf) return;

      let len
	  try {
	  	len = mp.get_msg_len(buf)
      } catch(err) {
	  	this._socket.destroy(err)
		return
	  }

      if(!len) {
        this._socket.unshift(buf)
	  }

      // ensure that we don't exceed the max size of 256KiB (TODO: need to review this for MRCP)
      if (len > 2 ** 18) {
        this.socket.destroy(new Error('Max length exceeded'));
        return
      }

      // With the length, we can then consume the rest of the body.
      let msg = this._socket.read(len - minimum_bytes);

      // If we did not have enough data on the wire to read the body
      // we will wait for the body to arrive and push the length
      // back into the socket's read buffer with unshift.
      if (!msg) {
        this._socket.unshift(buf);
        return;
      }

      msg = Buffer.concat([buf, msg])

      let parsed_msg;
	  if(this._server_mode) {
       	parsed_msg = mp.parse_client_msg(msg)
      } else {
	  	parsed_msg = mp.parse_server_msg(msg)
      }
     
      // Push the data into the read buffer and capture whether
      // we are hitting the back pressure limits
      let pushOk = this.push(parsed_msg);

      // When the push fails, we need to pause the ability to read
      // messages because the consumer is getting backed up.
      if (!pushOk) this._readingPaused = true;
    }
  }

  /**
    Implements the readable stream method `_read`. This method will
    flagged that reading is no longer paused since this method should
    only be called by a consumer reading data.
    @private
   */
  _read() {
    this._readingPaused = false;
    setImmediate(this._onReadable.bind(this));
  }

  /**
    Implements the writeable stream method `_write` by serializing
    the object and pushing the data to the underlying socket.
   */
  _write(data, encoding, cb) {
    this._socket.write(data, cb);
  }

  /**
    Implements the writeable stream method `_final` used when
    .end() is called to write the final data to the stream.
   */
  _final(cb) {
    this._socket.end(cb);
  }
}

module.exports = MrcpSocket;

