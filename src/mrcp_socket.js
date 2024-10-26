// Based on code from http://derpturkey.com/extending-tcp-socket-in-node-js/

const { Socket } = require("net");
const { Duplex } = require("stream");

const mp = require("./mrcp_parser.js");

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

    this._buffer = Buffer.alloc(0);

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
    this._socket.on("close", (hadError) => this.emit("close", hadError));
    this._socket.on("connect", () => this.emit("connect"));
    this._socket.on("drain", () => this.emit("drain"));
    this._socket.on("end", () => this.emit("end"));
    this._socket.on("error", (err) => this.emit("error", err));
    this._socket.on('lookup', (err, address, family, host) => this.emit('lookup', err, address, family, host)); // prettier-ignore
    this._socket.on("ready", () => this.emit("ready"));
    this._socket.on("timeout", () => this.emit("timeout"));
    this._socket.on("readable", this._onReadable.bind(this));
  }

  /**
    Performs data read events which are triggered under two conditions:
    1. underlying `readable` events emitted when there is new data
       available on the socket
    2. the consumer requested additional data
    @private
   */
  _onReadable() {
    const entireBuffer = this._socket.read();

    if (entireBuffer && entireBuffer.length) {
        // e.g. Logs 1022
        console.log('Current entire buffer length', entireBuffer.length);
        // Return the content we just read to not interfere with the upcoming code
        this._socket.unshift(entireBuffer);
    }

    const chunk = this._socket.read();
    if (chunk) {
      this._buffer = Buffer.concat([this._buffer, chunk]);

      // Check if there's enough data to determine message length
      if (this._buffer.length >= 32) {
        let len;
        try {
          len = mp.get_msg_len(this._buffer); // Determine message length
        } catch (err) {
          this._socket.destroy(err); // Handle parse error
          return;
        }

        // If we have enough data for a full message, process it
        if (this._buffer.length >= len) {
          const message = this._buffer.slice(0, len); // Extract message
          this._buffer = this._buffer.slice(len); // Remove processed message from buffer

          try {
            const parsedMessage = mp.parse_msg(message); // Parse the message
            const pushOk = this.push(parsedMessage); // Push parsed message to the stream

            if (!pushOk) this._readingPaused = true; // Handle backpressure
          } catch (err) {
            this._socket.destroy(err); // Handle parse error
          }
        }
      }
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
