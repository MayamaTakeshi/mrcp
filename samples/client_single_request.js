const mrcp = require("../index.js");

let client = mrcp.createClient({
  host: "localhost",
  port: 9000,
});

var request_id = 1;

const msg = mrcp.builder.build_request(
  "RECOGNIZE",
  request_id,
  {
    "channel-identifier": "AB32AECB23433801@speechrecog",
    "content-type": "application/xml",
  },
  "<root>test</root>",
);
console.log("Sending MRCP requests. result: ", client.write(msg));

client.on("error", console.error);
client.on("close", console.log);
client.on("data", (data) => {
  console.log("***********************************************");
  console.log("on data:");
  console.log(data);
  console.log();
});
