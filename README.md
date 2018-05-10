# scrappy-ircd

> tiny hackable irc server

Slack decided to remove its IRC gateway, and as an already unwilling user of
their service, I sure as heck wasn't going to use their heavy, closed, slow
frontend as well. So I wrote a minimal IRC server implementation, to be paired
with `slack-irc`, to enable continued interaction with Slack via IRC.

## Install

### Setup a slack bot

In the controls for your organization's slack setup, add a new app/bot and
`/invite` it to the channels you'd like to replicate to IRC.

### Setup slack-irc and scrappy-ircd

On the machine running your long-lived IRC client:

```
$ npm i -g slack-irc

$ npm i -g scrappy-ircd

# configure slack-irc to replicate the channels you're interested in
$ cat > slack_irc_config.json
[                                                                                                                                                                           {
    "nickname": "irc-bot",
    "server": "localhost",
    "token": "SLACK-BOT-OAUTH-TOKEN",
    "channelMapping": {
      "slack-channel-name-sans-#": "#local-irc-channel"
    }
  }
]
^D
```

Now you can run `ircd` and `slack-irc -c slack_irc_config.json`.

Add the server `localhost` port `6667` to your IRC client and you can join the
channels in the channel mapping above and ought to see messages bridged between
here and slack!

## Password

You can (hackily) set a password on ircd:

1. run `ircd` as `ircd --password foobar`
2. upon connecting with your client, send a private message to `authbot` with
   that password; this will let you run other commands like JOIN, PRIVMSG, etc.

## What does it do / not do?

It doesn't do most of RFC 1459. It does just enough to play nice with
`slack-irc` and my own ad-hoc tests with `weechat`. If it's not working with
your client, open an issue and take a peek at the code!

Implemented:

- `NICK`
- `JOIN`
- `PING` / `PONG`
- `PRIVMSG` to channel
- `PRIVMSG` to user

Superficially implemented (to make clients behave):
- `USER`
- `MODE`
- `WHOIS`

# License

ISC
