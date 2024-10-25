const net = require('net')
const mrcp = require('../index.js')


function splitAtIndex(str, index) {
    // Ensure the index is within the string bounds
    if (index < 0 || index > str.length) {
        return [str, ''];
    }

    // Slice the string into two parts
    const part1 = str.slice(0, index);
    const part2 = str.slice(index);

    return [part1, part2];
}

// construct a server
let server = mrcp.createServer((conn) => { 
	conn.on('data', data => {
		console.log('***********************************************')
		console.log('on data:')
		console.log(data);

		var msg
		msg = mrcp.builder.build_response(data.request_id, 200, 'IN-PROGRESS', {
			'channel-identifier': data.headers['channel-identifier'],
		}),
		console.log()
		console.log(`Sending response: conn.write(msg) result=${conn.write(msg)}`)

		console.log()
		const body = `<?xml version='1.0'?>
<result>
<interpretation 01234567789123456790123456789012345679012345678901234>
    <instance>
    one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six one eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine
    </instance>
    <input mode="speech">
    one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six one eight nine one two three four five six seven eight nine one two three four five six seven eight nine one two three four five six seven eight nine
    </input>
</interpretation>
</result>
`

		msg = mrcp.builder.build_event('RECOGNITION-COMPLETE', data.request_id, 'COMPLETE', {
			'channel-identifier': data.headers['channel-identifier'],
			'completion-cause': '000 success',
			'content-type': 'application/x-nlsml',
		}, body)

		const [firstPart, secondPart] = splitAtIndex(msg, 1022);
		console.log(`Sending event firstPart: conn.write(msg) result=${conn.write(firstPart)}`)
		console.log(`Sending event secondPart: conn.write(msg) result=${conn.write(secondPart)}`)
	});
});
server.listen(9000);
