#!/usr/bin/env node

var net = require('net')
var argv = require('minimist')(process.argv)
var ircd = require('.')({password: argv.p || argv.password || undefined})

var server = net.createServer(function (socket) {
  ircd(socket)
  console.log('CONNECTION', socket.remoteAddress, socket.remotePort)
})

server.listen(6667, function () {
  console.log('listening on port 6667')
})
