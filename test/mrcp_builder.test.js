const mb = require('../src/mrcp_builder.js');

test('calc_msg_len', () => {
	expect(
		mb.calc_msg_len(4)
	).toBe(5)

	expect(
		mb.calc_msg_len(8)
	).toBe(9)

	expect(
		mb.calc_msg_len(9)
	).toBe(11)

	expect(
		mb.calc_msg_len(97)
	).toBe(99)

	expect(
		mb.calc_msg_len(98)
	).toBe(101)

	expect(
		mb.calc_msg_len(99)
	).toBe(102)

	expect(
		mb.calc_msg_len(996)
	).toBe(999)

	expect(
		mb.calc_msg_len(997)
	).toBe(1001)

	expect(
		mb.calc_msg_len(998)
	).toBe(1002)
})

test('build_request', () => {
	var method = 'SPEAK'
	var request_id = 1
	var result = mb.build_request(method, request_id, {
			'content-type': 'application/xml',
			'content-length': 17,
		},
		'<root>test</root>'
	)

	var message_length = 91

	var expected = `MRCP/2.0 ${message_length} ${method} ${request_id}\r\ncontent-type: application/xml\r\ncontent-length: 17\r\n\r\n<root>test</root>`

	expect(result).toBe(expected)
	expect(result.length).toBe(message_length)
})

test('build_response', () => {
	var request_id = 123
	var status_code = 200
	var request_state = 'IN-PROGRESS'
	var result = mb.build_response(request_id, status_code, request_state, {
			'content-type': 'application/xml',
			'content-length': 17,
		},
		'<root>test</root>'
	)

	var message_length = 104

	var expected = `MRCP/2.0 ${message_length} ${request_id} ${status_code} ${request_state}\r\ncontent-type: application/xml\r\ncontent-length: 17\r\n\r\n<root>test</root>`

	expect(result).toBe(expected)
	expect(result.length).toBe(message_length)
})

test('build_event', () => {
	var event_name = 'SPEAK-COMPLETE'
	var request_id = 987654321
	var request_state = 'COMPLETE'
	var result = mb.build_event(event_name, request_id, request_state, {
			'content-type': 'application/xml',
			'content-length': 17,
		},
		'<root>test</root>'
	)

	var message_length = 118

	var expected = `MRCP/2.0 ${message_length} ${event_name} ${request_id} ${request_state}\r\ncontent-type: application/xml\r\ncontent-length: 17\r\n\r\n<root>test</root>`

	expect(result).toBe(expected)
	expect(result.length).toBe(message_length)
})


