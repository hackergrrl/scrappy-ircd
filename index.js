var net = require('net')

var server = net.createServer(function (socket) {
console.log('got someone')
socket.pipe(process.stdout)
})

server.listen(6667)

