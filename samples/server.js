const net = require('net')
const mrcp = require('../index.js')

// construct a server
let server = mrcp.createServer((conn) => { 
	conn.on('data', data => {
		console.log('***********************************************')
		console.log('on data:')
		console.log(data);

		var msg
		msg = mrcp.builder.build_response(data.request_id, 200, 'IN-PROGRESS', {'content-type': 'application/xml', 'content-length': 17}, "<root>test</root>")
		console.log()
		console.log(`Sending response: conn.write(msg) result=${conn.write(msg)}`)

		console.log()
		msg = mrcp.builder.build_response('SPEAK-COMPLETE', data.request_id, 'COMPLETE', {'content-type': 'application/xml', 'content-length': 17}, "<root>test</root>")
		console.log(`Sending event: conn.write(msg) result=${conn.write(msg)}`)
	});

});
server.listen(9000);
