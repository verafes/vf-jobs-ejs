//tests/test_server.js
const app = require("../app");
const http = require("http");

module.exports = http.createServer(app);