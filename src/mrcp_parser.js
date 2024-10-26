const TAB = 0x09;
const SPACE = 0x20;

// Request message start-line:  MRCP/2.0 message-length method-name request-id
const reRequestLine = new RegExp(
  "^MRCP/(?<version>([0-9]+).([0-9]+))[ \t]+([0-9]+)[ \t]+(?<method>[-A-Z]+)[ \t]+(?<request_id>[0-9]+)$",
);

// Response Message start-line: MRCP/2.0 message-length request-id status-code request-state
const reResponseLine = new RegExp(
  "^MRCP/(?<version>([0-9]+).([0-9]+))[ \t]+([0-9]+)[ \t]+(?<request_id>[0-9]+)[ \t]+(?<status_code>[0-9]+)[ \t]+(?<request_state>[-A-Z]+)$",
);

// Event Message start-line: MRCP/2.0 message-length event-name request-id request-state
const reEventLine = new RegExp(
  "^MRCP/(?<version>([0-9]+).([0-9]+))[ \t]+([0-9]+)[ \t]+(?<event_name>[-A-Z]+)[ \t]+(?<request_id>[0-9]+)[ \t]+(?<request_state>[-A-Z]+)$",
);

const get_msg_len = (buf) => {
  if (buf.length < 5) return null;

  if (buf.slice(0, 5).toString() != "MRCP/") throw "Not MRCP message";

  var start, end;
  var c;

  var i = 5;

  while (i++ < buf.length) {
    c = buf[i];
    if (c == TAB || c == SPACE) break;
  }

  while (i++ < buf.length) {
    c = buf[i];
    if (c != TAB && c != SPACE) {
      start = i;
      break;
    }
  }

  while (i++ < buf.length) {
    c = buf[i];
    if (c == TAB || c == SPACE) {
      end = i;
      break;
    }
  }

  if (!start || !end) return null;

  var ml = buf.slice(start, end).toString();

  if (isNaN(ml)) throw "Invalid MRCP message-length";

  return parseInt(ml);
};

const _parse_headers = (s, start, idx, data) => {
  while (idx > 0) {
    var header_line = s.substring(start, idx);
    if (header_line == "") {
      start = idx + 2; // \r\n
      break;
    }

    var posColon = header_line.indexOf(":", 1);
    if (posColon < 0) throw "Invalid MRCP header-line";

    var key = header_line.substring(0, posColon).trim();
    if (key == "") throw "Invalid MRCP blank header-name";

    var val = header_line.substring(posColon + 1).trim();

    data.headers[key.toLowerCase()] = val;
    start = idx + 2; // \r\n
    idx = s.indexOf("\r\n", start);
  }

  return start;
};

const parse_msg = (msg) => {
  var data = {};
  var s;
  if (Buffer.isBuffer(msg)) {
    s = msg.toString("utf-8");
  } else {
    s = msg;
  }

  var idx = s.indexOf("\r\n");
  if (idx < 0) throw "Invalid MRCP message: no line terminators";

  var start = 0;
  var start_line = s.substring(start, idx);
  var m = start_line.match(reRequestLine);
  if (m) {
    data.type = "request";
    data.version = m.groups.version;
    data.method = m.groups.method;
    data.request_id = parseInt(m.groups.request_id);
  } else {
    m = start_line.match(reResponseLine);
    if (m) {
      data.type = "response";
      data.version = m.groups.version;
      data.request_id = parseInt(m.groups.request_id);
      data.status_code = parseInt(m.groups.status_code);
      data.request_state = m.groups.request_state;
    } else {
      m = start_line.match(reEventLine);
      if (m) {
        data.type = "event";
        data.version = m.groups.version;
        data.event_name = m.groups.event_name;
        data.request_id = parseInt(m.groups.request_id);
        data.request_state = m.groups.request_state;
      }
    }
  }

  if (!m) throw "Invalid MRCP start-line";

  start = idx + 2; // \r\n
  idx = s.indexOf("\r\n", start);
  data.headers = {};
  start = _parse_headers(s, start, idx, data);
  var body = s.substring(start);
  if (body != "") {
    data.body = body;
  }

  return data;
};

module.exports = {
  get_msg_len,
  parse_msg,
};
