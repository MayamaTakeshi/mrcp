
const calc_msg_len = (len) => {
	var msg_len = 1
	var limit = 9
	while(true) {
		if(len < limit) break
		
		msg_len++
		limit = 10**msg_len - msg_len
	}

	return len + msg_len
}

const _join_headers = (headers) => {
	return Object.keys(headers).map((key, index) => {
		return `${key}: ${headers[key]}\r\n`
	}).join("")
}

// Request message start-line:  MRCP/2.0 message-length method-name request-id
const build_request = (method_name, request_id, headers, body) => {
	var msg = `${method_name} ${request_id}\r\n${_join_headers(headers)}\r\n${body}`
	var len = 10 + msg.length // 10 = MRCP/.20 + two spaces around message-length

	var msg_len = calc_msg_len(len)

	return `MRCP/2.0 ${msg_len} ${msg}`
}

// Response Message start-line: MRCP/2.0 message-length request-id status-code request-state
const build_response = (request_id, status_code, request_state, headers, body) => {
	var msg = `${request_id} ${status_code} ${request_state}\r\n${_join_headers(headers)}\r\n${body}`
	var len = 10 + msg.length // 10 = MRCP/.20 + two spaces around message-length

	var msg_len = calc_msg_len(len)

	return `MRCP/2.0 ${msg_len} ${msg}`
}

// Event Message start-line: MRCP/2.0 message-length event-name request-id request-state
const build_event = (event_name, request_id, request_state, headers, body) => {
	var msg = `${event_name} ${request_id} ${request_state}\r\n${_join_headers(headers)}\r\n${body}`
	var len = 10 + msg.length // 10 = MRCP/.20 + two spaces around message-length

	var msg_len = calc_msg_len(len)

	return `MRCP/2.0 ${msg_len} ${msg}`
}

module.exports = {
	calc_msg_len,
	build_request,
	build_response,
	build_event,
}

