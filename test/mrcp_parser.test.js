const mp = require('../src/mrcp_parser.js');

test('get_msg_len: Not MRCP message', () => {
	expect(() => {
		mp.get_msg_len(Buffer.from("abcde"))
	}).toThrow("Not MRCP message")
})

test('get_msg_len: Not enough bytes', () => {
	expect(
		mp.get_msg_len(Buffer.from("MRC"))
	).toBe(null)

	expect(
		mp.get_msg_len(Buffer.from("MRCP/"))
	).toBe(null)

	expect(
		mp.get_msg_len(Buffer.from("MRCP/2.0"))
	).toBe(null)

	expect(
		mp.get_msg_len(Buffer.from("MRCP/2.0 "))
	).toBe(null)

	expect(
		mp.get_msg_len(Buffer.from("MRCP/2.0 123"))
	).toBe(null)
})

test('get_msg_len: Invalid MRCP message-length', () => {
	expect(() => {
		mp.get_msg_len(Buffer.from("MRCP/2.0 1A3 "))
	}).toThrow("Invalid MRCP message-length")
})

test('get_msg_len: OK', () => {
	expect(
		mp.get_msg_len(Buffer.from("MRCP/2.0 103 "))
	).toBe(103)

	expect(
		mp.get_msg_len(Buffer.from("MRCP/2.0 00047 "))
	).toBe(47)

	expect(
		mp.get_msg_len(Buffer.from("MRCP/2.0\t \t\t  \t1024\t  \t"))
	).toBe(1024)
})

test('parse_client_msg', () => {
	expect(() => {
		mp.parse_client_msg(Buffer.from("abcde"))
	}).toThrow("Invalid MRCP message: no line terminators")

	expect(() => {
		mp.parse_client_msg(Buffer.from("MRCP/2.0 0 0 0\r\n"))
	}).toThrow("Invalid MRCP start-line")

	expect(() => {
		mp.parse_client_msg(Buffer.from("MRCP/2.0 1024 SPEAK 1\r\nsome-header: abc\r\ninvalid-header\r\n"))
	}).toThrow("Invalid MRCP header-line")

	expect(() => {
		mp.parse_client_msg(Buffer.from("MRCP/2.0 1024 SPEAK 1\r\nsome-header: abc\r\n  : defghi\r\n"))
	}).toThrow("Invalid MRCP blank header-name")

	expect(
		mp.parse_client_msg(Buffer.from("MRCP/2.0 1024 SPEAK 1\r\nheader-one: abc\r\nHEADER-TWO: defghi\r\n"))
	).toEqual({
		type: 'request',
		version: '2.0',
		method: 'SPEAK',
		request_id: 1,
		headers: {
			'header-one': 'abc',
			'header-two': 'defghi',
		},
	})

	expect(
		mp.parse_client_msg(Buffer.from("MRCP/2.0 1024 SPEAK 1\r\nContent-Type: application/xml\r\nContent-Length: 18\r\n\r\n<root>hello</root>"))
	).toEqual({
		type: 'request',
		version: '2.0',
		method: 'SPEAK',
		request_id: 1,
		headers: {
			'content-type': 'application/xml',
			'content-length': '18',
		},
		body: "<root>hello</root>",
	})
})


test('parse_server_msg: response', () => {
	expect(() => {
		mp.parse_server_msg(Buffer.from("abcde"))
	}).toThrow("Invalid MRCP message: no line terminators")

	expect(() => {
		mp.parse_server_msg(Buffer.from("MRCP/2.0 0 0 0\r\n"))
	}).toThrow("Invalid MRCP start-line")

	expect(() => {
		mp.parse_server_msg(Buffer.from("MRCP/2.0 1024 1 200 SOME-STATE\r\nsome-header: abc\r\ninvalid-header\r\n"))
	}).toThrow("Invalid MRCP header-line")

	expect(() => {
		mp.parse_server_msg(Buffer.from("MRCP/2.0 1024 123 200 SOME-STATE\r\nsome-header: abc\r\n  : defghi\r\n"))
	}).toThrow("Invalid MRCP blank header-name")

	expect(
		mp.parse_server_msg(Buffer.from("MRCP/2.0 1024 5 200 SOME-STATE\r\nheader-one: abc\r\nHEADER-TWO: defghi\r\n"))
	).toEqual({
		type: 'response',
		version: '2.0',
		request_id: 5,
		status_code: 200,
		request_state: 'SOME-STATE',
		headers: {
			'header-one': 'abc',
			'header-two': 'defghi',
		},
	})

	expect(
		mp.parse_server_msg(Buffer.from("MRCP/2.0 1024 12 200 SOME-STATE\r\nContent-Type: application/xml\r\nContent-Length: 18\r\n\r\n<root>hello</root>"))
	).toEqual({
		type: 'response',
		version: '2.0',
		request_id: 12,
		status_code: 200,
		request_state: 'SOME-STATE',
		headers: {
			'content-type': 'application/xml',
			'content-length': '18',
		},
		body: "<root>hello</root>",
	})
})


test('parse_server_msg: event', () => {
	expect(
		mp.parse_server_msg(Buffer.from("MRCP/2.0 1024 RECOGNITION-COMPLETE 12345 COMPLETE\r\nContent-Type: application/xml\r\nContent-Length: 18\r\n\r\n<root>hello</root>"))
	).toEqual({
		type: 'event',
		version: '2.0',
		event_name: 'RECOGNITION-COMPLETE',
		request_id: 12345,
		request_state: 'COMPLETE',
		headers: {
			'content-type': 'application/xml',
			'content-length': '18',
		},
		body: "<root>hello</root>",
	})
})



