module.exports = IRC

function IRC (opts) {
  if(!(this instanceof IRC)) return new IRC(opts)

  var users = {}
  var channels = {}

  return function (socket) {
    var user = {
      name: socket.remoteAddress + ':' + socket.remotePort,
      socket: socket,
      nick: 'anonymous_' + Math.floor(Math.random() * 9999)
    }
    user.username = user.nick
    user.realname = user.nick
    users[user] = user

    // console.log('CONNECTION', user.name, '(' + user.nick + ')')

    // socket.write(':localhost 001 ' + user.nick + ' :Welcome to a hacky server!\n')

    socket.on('data', function (buf) {
      var lines = buf.toString().trim()
      lines = lines.replace('\r', '')
      lines.split('\n').forEach(function (line) {
        // console.log('line', '"' + line + '"')
        processCommand(user, line, function () {})
      })
    })
  }

  function processCommand (user, line, cb) {
    var match

    // NICK
    match = line.match(/^NICK (.*)$/)
    if (match) {
      delete users[user.nick]
      // console.log(user.name, 'set NICK to', match[1])
      user.nick = match[1]
      users[user.nick] = user
      //user.socket.write(new Buffer(':' +user.nick + '!' + user.nick + '@temp' + ' NICK :' + user.nick + '\n', 'utf-8'))
      user.socket.write(':localhost 001 ' + user.nick + ' :Welcome to a hacky server!\n')
    }

    // USER
    match = line.match(/USER (.*) [08] \* :?(.*)$/)
    if (match) {
      user.username = match[1]
      user.realname = match[2]

      // motd hack
      user.socket.write(':localhost 375 ' + user.nick + ' :- localhost Message of the day - \n')
      user.socket.write(':localhost 372 ' + user.nick + ' :- whoo\n')
      user.socket.write(':localhost 376 ' + user.nick + ' :End of MOTD command\n')
      return cb()
    }

    // MODE
    match = line.match(/^MODE #(.*)$/)
    if (match) {
      var channel = '#' + match[1]
      user.socket.write(':localhost ' + channel + '+ns\n')
      return cb()
    }

    // JOIN
    match = line.match(/^JOIN #(.*)$/)
    if (match) {
      var channel = '#' + match[1]
      if (!channels[channel]) {
        channels[channel] = { users: [] }
      }
      channels[channel].users.push(user)
      // console.log(user.nick, 'joined ' + channel)
      user.socket.write(':' + user.nick + ' JOIN ' + channel + '\n')
      user.socket.write(':localhost ' + channel + ' :stock welcome message\n')
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
      return cb()
    }

    // PRIVMSG to channel
    match = line.match(/^PRIVMSG #(.*) :(.*)$/)
    if (match) {
      var channel = '#' + match[1]
      var msg = match[2]
      if (channels[channel] && channels[channel].users.indexOf(user) !== -1) {
        channels[channel].users.forEach(function (usr) {
          if (user === usr) return
          var buf = new Buffer(':'+user.nick+' PRIVMSG ' + channel + ' :' + msg + '\n', 'utf-8')
          usr.socket.write(buf)
        })
      }
      return cb()
    }

    // PRIVMSG to user
    match = line.match(/^PRIVMSG (.*) :(.*)$/)
    if (match) {
      var target = users[match[1]]
      if (!target) {
        // TODO: RPL_NOSUCHUSER?
        return cb()
      }
      var msg = match[2]
      var buf = new Buffer(':'+user.nick+' PRIVMSG ' + target.nick + ' :' + msg + '\n', 'utf-8')
      target.socket.write(buf)
      return cb()
    }

    // WHOIS
    match = line.match(/^WHOIS (.*)$/)
    if (match) {
      var nick = match[1]
      var target = users[nick]
      if (!target) {
        user.socket.write(':localhost 401 ' + user.nick + ' ' + nick + ' :No such nick/channel\n')
        return cb()
      }
      user.socket.write(':localhost 311 ' + user.nick + ' ' + target.nick + ' ' + target.username + ' fakeaddr * :' + target.realname + '\n')
      user.socket.write(':localhost 318 ' + user.nick + ' :End of WHOIS list\n')
      return cb()
    }

    match = line.match(/^PING (.*)$/)
    if (match) {
      user.socket.write(':localhost PONG localhost :' + match[1] + '\n')
      return cb()
    }

    cb()
  }
}
