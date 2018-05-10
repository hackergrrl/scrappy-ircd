#!/usr/bin/env node

var net = require('net')
var ircd = require('.')()

var server = net.createServer(function (socket) {
  ircd(socket)
  console.log('CONNECTION', socket.remoteAddress, socket.remotePort)
})

server.listen(6667, function () {
  console.log('listening on port 6667')
})
