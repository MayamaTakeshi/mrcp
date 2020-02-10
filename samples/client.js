const mrcp = require('../index.js')

let client = mrcp.createClient({
	host: 'localhost',
	port: 9000,
})

var request_id = 1

var intervalId = setInterval(() => {
	msg = mrcp.builder.build_request('SPEAK', request_id, {'content-type': 'application/xml', 'content-length': 17}, "<root>test</root>")
	msg = msg + msg + msg

	console.log('Sending MRCP requests. result: ', client.write(msg))
	request_id++
}, 10)

client.on('error', console.error)
client.on('close', () => { clearInterval(intervalId) })
client.on('data', data => {
	console.log('***********************************************')
	console.log('on data:')
	console.log(data)
	console.log()
})


