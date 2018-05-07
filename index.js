var net = require('net')

var users = {}
var channels = {}

var server = net.createServer(function (socket) {
  var user = {
    name: socket.remoteAddress + ':' + socket.remotePort,
    socket: socket,
    nick: 'anonymous_' + Math.floor(Math.random() * 9999)
  }
  users[user] = user

  console.log('CONNECTION', user.name, '(' + user.nick + ')')
  socket.on('data', function (buf) {
    var line = buf.toString().trim()
    var match
    console.log('line', '"' + line + '"')

    // NICK
    match = line.match(/^NICK (.*)$/)
    if (match) {
      delete users[user.nick]
      console.log(user.name, 'set NICK to', match[1])
      user.nick = match[1]
      users[user.nick] = user
    }

    // JOIN
    match = line.match(/^JOIN #(.*)$/)
    if (match) {
      var channel = '#' + match[1]
      if (!channels[channel]) {
        channels[channel] = { users: [] }
      }
      channels[channel].users.push(user)
      console.log(user.name, 'joined #' + channel)
    }

    // PRIVMSG
    match = line.match(/^PRIVMSG #(.*) :(.*)$/)
    if (match) {
      console.log(user.name, 'set NICK to', match[1])
      console.log('match', match)
      var channel = '#' + match[1]
      var msg = match[2]
      if (channels[channel] && channels[channel].users.indexOf(user) !== -1) {
        channels[channel].users.forEach(function (user) {
          var buf = new Buffer('PRIVMSG ' + channel + ' ' + user.nick + ' ' + msg + '\n', 'utf-8')
          user.socket.write(buf)
        })
      }
    }
  })
})

server.listen(6667)

