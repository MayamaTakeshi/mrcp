const mrcp = require('../index.js')

async function run() {
	let socket = new mrcp.socket();

	socket.connect({ host: 'localhost', port: 9000 })

	var request_id = 1

	var intervalId = setInterval(() => {
		msg = mrcp.builder.build_request('SPEAK', request_id, {'content-type': 'application/xml', 'content-length': 17}, "<root>test</root>")
		msg = msg + msg + msg

		console.log('Sending MRCP requests. result: ', socket.write(msg))
		request_id++
	}, 10)

	socket.on('error', console.error)
	socket.on('close', () => { clearInterval(intervalId) })
	socket.on('data', data => {
		console.log('***********************************************')
		console.log('on data:')
		console.log(data)
		console.log()
	})
}

run().catch(console.error)
