const parser = require('./src/mrcp_parser.js')
const builder = require('./src/mrcp_builder.js')
const mrcp_socket = require('./src/mrcp_socket.js')

const net = require('net')

module.exports = {
	parser,
	builder,

	createServer: (cb) => {
		let server = new net.Server(socket => {
			ms = new mrcp_socket(socket, true)
			cb(ms)
		})
		return server
	},

	createClient: (options) => {
		let client = new mrcp_socket()
		client.connect(options)
		return client
	},
}
