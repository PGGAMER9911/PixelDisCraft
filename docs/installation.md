# Installation Guide

> Step-by-step instructions to set up PixelDisCraft on your Minecraft server and Discord.

---

## Prerequisites

Before you begin, make sure you have:

| Requirement | Minimum Version | Download |
|-------------|----------------|----------|
| Java | 17+ | [Adoptium](https://adoptium.net/) |
| PaperMC Server | 1.20.4+ (1.21+ recommended) | [PaperMC](https://papermc.io/downloads) |
| Node.js | 18+ | [Node.js](https://nodejs.org/) |
| npm | 9+ | Included with Node.js |
| Discord Bot Application | — | [Developer Portal](https://discord.com/developers/applications) |

> **Compatibility note:** The plugin uses only the Paper API (no NMS) and is compatible with PaperMC 1.20.4 and newer, including 1.21+ builds.

---

## Step 1 — Download the Plugin

1. Go to the **[GitHub Releases](https://github.com/PGGAMER9911/PixelDisCraft/releases)** page
2. Download the latest `PixelDisCraft-X.X.jar` file
3. Place the JAR into your Minecraft server's `plugins/` folder

```
your-server/
├── paper-1.2x.x.jar              ← 1.20.4 or newer
├── plugins/
│   └── PixelDisCraft-1.0.jar    ← Place here
├── server.properties
└── ...
```

---

## Step 2 — Generate Default Config

Start your Minecraft server once:

```bash
java -jar paper-1.2x.x.jar
```

The plugin will:
- Create the `plugins/PixelDisCraft/` folder
- Generate a default `config.yml`
- Print startup validation warnings (expected on first run)

Stop the server after it fully starts.

---

## Step 3 — Configure the Plugin

Edit `plugins/PixelDisCraft/config.yml`:

```yaml
discord:
  bot-token: "YOUR_BOT_TOKEN_HERE"
  guild-id: "YOUR_DISCORD_SERVER_ID"
  chat-channel-id: "CHANNEL_FOR_CHAT_BRIDGE"
  log-channel-id: "CHANNEL_FOR_LOG_MESSAGES"

bridge:
  secret-token: "GENERATE_A_STRONG_RANDOM_TOKEN"
  api-port: 8765
  api-host: "0.0.0.0"
  bot-api-url: "http://localhost:3000"

features:
  chat-bridge: true
  join-leave: true
  death-messages: true
  stats: true
  voice-channel: false
  screenshot: false
```

> ⚠️ **Important:** Generate a strong random token for `secret-token`. This must be identical in both the plugin config and the bot's `.env` file.

See [Configuration Guide](configuration.md) for detailed explanations of every setting.

---

## Step 4 — Create a Discord Bot Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it "PixelDisCraft"
3. Go to **Bot** → Click **Add Bot**
4. Copy the **Bot Token** — paste it into `config.yml` under `discord.bot-token`
5. Enable these **Privileged Gateway Intents**:
   - ✅ Message Content Intent
   - ✅ Server Members Intent
   - ✅ Presence Intent
6. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Administrator` (or select specific permissions)
7. Copy the generated URL and invite the bot to your Discord server

---

## Step 5 — Install the Discord Bot

Clone or download the bot source from this repository:

```bash
cd discord-bot
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_application_id
GUILD_ID=your_discord_server_id
MINECRAFT_API_URL=http://localhost:8765
SECRET_TOKEN=same_token_as_plugin_config
CHAT_CHANNEL_ID=channel_id_for_chat
LOG_CHANNEL_ID=channel_id_for_logs
ADMIN_ROLE=Minecraft Admin
```

> The `SECRET_TOKEN` here **must match** the `bridge.secret-token` in your plugin's `config.yml`.

---

## Step 6 — Start Everything

### Start the Minecraft server

```bash
java -jar paper-1.20.4.jar
```

Verify in the console:
```
[PixelDisCraft] [Config] Configuration validated successfully.
[PixelDisCraft] [API] REST API server started on 0.0.0.0:8765
[PixelDisCraft] [Setup] Chat bridge listener registered
[PixelDisCraft] [Setup] Join/Leave listener registered
```

### Start the Discord bot

```bash
cd discord-bot
node src/index.js
```

Verify in the terminal:
```
[INFO] Bot logged in as PixelDisCraft#1234
[INFO] API server listening on port 3000
[INFO] Slash commands registered for guild ...
```

---

## Step 7 — Verify the Connection

1. Join your Minecraft server
2. Check Discord — you should see a join notification in the log channel
3. Send a chat message in Minecraft — it should appear in the Discord chat channel
4. Type a message in the Discord chat channel — it should appear in Minecraft
5. Use `/server` in Discord — you should see server status

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot doesn't respond to slash commands | Make sure `CLIENT_ID` and `GUILD_ID` are correct in `.env` |
| "Unauthorized" errors in logs | Verify `SECRET_TOKEN` matches in both `.env` and `config.yml` |
| Plugin can't reach the bot | Check that the bot is running and `bot-api-url` points to the correct host:port |
| Chat messages don't appear | Verify `chat-channel-id` is correct and `features.chat-bridge` is `true` |
| "Message Content Intent" error | Enable Message Content Intent in the Discord Developer Portal |

---

## Running as a Service (Optional)

### Bot with PM2

```bash
npm install -g pm2
pm2 start src/index.js --name pixeldiscraft-bot
pm2 save
pm2 startup
```

### Bot with systemd (Linux)

```ini
[Unit]
Description=PixelDisCraft Discord Bot
After=network.target

[Service]
Type=simple
User=minecraft
WorkingDirectory=/opt/pixeldiscraft/discord-bot
ExecStart=/usr/bin/node src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
