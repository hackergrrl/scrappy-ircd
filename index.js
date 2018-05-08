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

  socket.write(':localhost 001 ' + user.nick + ' :Welcome to a hacky server!\n')

  socket.on('data', function (buf) {
    var lines = buf.toString().trim()
    lines = lines.replace('\r', '')
    lines.split('\n').forEach(function (line) {
      console.log('line', '"' + line + '"')
      processCommand(user, line, function () {})
    })
  })
})

server.listen(6667)

function processCommand (user, line, cb) {
  var match

  // NICK
  match = line.match(/^NICK (.*)$/)
  if (match) {
    delete users[user.nick]
    console.log(user.name, 'set NICK to', match[1])
    user.nick = match[1]
    users[user.nick] = user
    //user.socket.write(new Buffer(':' +user.nick + '!' + user.nick + '@temp' + ' NICK :' + user.nick + '\n', 'utf-8'))
    user.socket.write(':localhost 001 ' + user.nick + ' :Welcome to a hacky server!\n')
  }

  // JOIN
  match = line.match(/^JOIN #(.*)$/) || line.match(/^MODE #(.*)$/)
  if (match) {
    var channel = '#' + match[1]
    if (!channels[channel]) {
      channels[channel] = { users: [] }
    }
    channels[channel].users.push(user)
    console.log(user.name, 'joined ' + channel)
    // ':scroffle!~sww@c-73-15-8-51.hsd1.ca.comcast.net JOIN #testerya'
    user.socket.write(':' + user.nick + ' JOIN ' + channel + '\n')
    //user.socket.write(':localhost MODE ' + channel + ' +ns\n')
    user.socket.write(':localhost JOIN ' + channel + ' +ns\n')
    var nicks = channels[channel].users
      .map(function (usr) {
        return usr.nick
      })
      .join(' ')
    user.socket.write(':localhost 353 ' + user.nick + ' @ ' + channel + ' :' + nicks + '\n')
    user.socket.write(':localhost 366 ' + user.nick + ' ' + channel + ' :End of /NAMES list.\n')

    channels[channel].users.forEach(function (usr) {
      if (user === usr) return
      var buf = new Buffer(':localhost '+channel+' JOIN ' + user.nick + '\n', 'utf-8')
      usr.socket.write(buf)
    })
  }

  // PRIVMSG
  match = line.match(/^PRIVMSG #(.*) :(.*)$/)
  if (match) {
    console.log(user.nick, 'set NICK to', match[1])
    var channel = '#' + match[1]
    var msg = match[2]
    if (channels[channel] && channels[channel].users.indexOf(user) !== -1) {
      channels[channel].users.forEach(function (usr) {
        if (user === usr) return
        var buf = new Buffer(':'+user.nick+' PRIVMSG ' + channel + ' ' + msg + '\n', 'utf-8')
        usr.socket.write(buf)
      })
    }
  }

  cb()
}
