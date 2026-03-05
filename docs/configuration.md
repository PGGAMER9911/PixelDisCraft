# Configuration Guide

> Detailed explanation of every configuration option in PixelDisCraft.

---

## Plugin Configuration (`config.yml`)

The plugin generates this file on first startup at `plugins/PixelDisCraft/config.yml`.

---

### Discord Settings

```yaml
discord:
  bot-token: "YOUR_BOT_TOKEN"
  guild-id: "YOUR_GUILD_ID"
  chat-channel-id: "CHANNEL_ID"
  log-channel-id: "CHANNEL_ID"
  screenshot-channel-id: "CHANNEL_ID"
  webhook-url: ""
```

| Key | Type | Description |
|-----|------|-------------|
| `bot-token` | String | Your Discord bot token from the Developer Portal. **Keep this secret.** |
| `guild-id` | String | The ID of your Discord server. Right-click the server → Copy Server ID. |
| `chat-channel-id` | String | The Discord channel where Minecraft ↔ Discord chat is bridged. |
| `log-channel-id` | String | The channel for join/leave/death notifications. Leave empty to disable. |
| `screenshot-channel-id` | String | Fallback channel for screenshots if DM delivery fails. |
| `webhook-url` | String | (Optional) Discord webhook URL for chat bridge. Provides player avatars. |

---

### Bridge Settings

```yaml
bridge:
  secret-token: "CHANGE_ME"
  api-port: 8765
  api-host: "0.0.0.0"
  bot-api-url: "http://localhost:3000"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `secret-token` | String | `CHANGE_ME` | **Critical.** Shared secret used to authenticate requests between the plugin and bot. Must be identical on both sides. Generate a strong random string (32+ characters). |
| `api-port` | Integer | `8765` | Port the plugin's REST API listens on. |
| `api-host` | String | `0.0.0.0` | Bind address. Use `127.0.0.1` if the bot runs on the same machine (recommended). |
| `bot-api-url` | String | `http://localhost:3000` | Full URL of the Discord bot's API. Change the host if the bot runs on a different machine. |

> ⚠️ **Security Warning:** If `secret-token` is left as `CHANGE_ME`, the plugin will log a warning on every startup. Always change this before going to production.

---

### Permissions

```yaml
permissions:
  admin-role: "Minecraft Admin"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `admin-role` | String | `Minecraft Admin` | The Discord role name required to use admin commands (`/mc`, `/kick`, `/ban`). Users without this role will receive a permission error. |

---

### Feature Toggles

```yaml
features:
  chat-bridge: true
  join-leave: true
  death-messages: true
  stats: true
  voice-channel: false
  screenshot: false
  role-sync: false
```

| Feature | Default | Description |
|---------|---------|-------------|
| `chat-bridge` | `true` | Enable bi-directional Minecraft ↔ Discord chat |
| `join-leave` | `true` | Post join/leave notifications to the log channel |
| `death-messages` | `true` | Post death messages to the log channel |
| `stats` | `true` | Track kills, deaths, and playtime per player |
| `voice-channel` | `false` | Create/delete per-player voice channels |
| `screenshot` | `false` | Enable the `/screenshot` command |
| `role-sync` | `false` | Sync Minecraft groups to Discord roles |

---

### Database Settings

```yaml
database:
  enabled: false
  type: "sqlite"
  mysql:
    host: "localhost"
    port: 3306
    database: "discordbridge"
    username: "root"
    password: "password"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Boolean | `false` | When `false`, uses JSON flat-file storage. When `true`, uses SQL database. |
| `type` | String | `sqlite` | `sqlite` (local file) or `mysql` (remote database). |
| `mysql.*` | — | — | MySQL connection settings. Only used when `type` is `mysql`. |

> SQLite is recommended for single-server setups. Use MySQL if you need shared storage across multiple servers.

---

### Message Formats

```yaml
messages:
  minecraft-to-discord: "[MC] **%player%**: %message%"
  discord-to-minecraft: "&b[Discord] &f%user%&7: &f%message%"
  player-join: "🟢 **%player%** joined the server"
  player-leave: "🔴 **%player%** left the server"
  death-message: "☠ %message%"
  link-code-generated: "&aYour link code is: &e%code% &a- Use /link %code% in Discord within 5 minutes."
  link-success-minecraft: "&aYour account has been linked to Discord!"
  link-already-linked: "&cYour account is already linked!"
```

**Placeholders:**

| Placeholder | Available In | Value |
|-------------|-------------|-------|
| `%player%` | Join, leave, chat | Minecraft player name |
| `%user%` | Discord → MC chat | Discord display name |
| `%message%` | Chat, death | The message or death text |
| `%code%` | Link code | The generated 6-character code |

**Formatting:**
- Discord messages support **Markdown** (`**bold**`, `__underline__`, etc.)
- Minecraft messages support `&` color codes (`&a` = green, `&b` = aqua, etc.)

---

### Voice Channel Settings

```yaml
voice-channel:
  category-id: ""
  name-format: "%player%'s Voice Channel"
```

| Key | Description |
|-----|-------------|
| `category-id` | Discord category ID where voice channels are created. |
| `name-format` | Name template for created voice channels. `%player%` is replaced with the player name. |

---

### Screenshot Settings

```yaml
screenshot:
  cooldown: 30
  require-linked: true
```

| Key | Default | Description |
|-----|---------|-------------|
| `cooldown` | `30` | Seconds between `/screenshot` uses per player. |
| `require-linked` | `true` | If `true`, only linked players can use `/screenshot` (needed for DM delivery). |

---

### Role Sync Mapping

```yaml
role-sync:
  admin: "DISCORD_ROLE_ID"
  moderator: "DISCORD_ROLE_ID"
  vip: "DISCORD_ROLE_ID"
```

Maps Minecraft permission group names to Discord role IDs. When a player links their account, the corresponding Discord roles are assigned.

---

## Bot Configuration (`.env`)

The Discord bot uses environment variables:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
MINECRAFT_API_URL=http://localhost:8765
SECRET_TOKEN=must_match_plugin_config
CHAT_CHANNEL_ID=channel_id
LOG_CHANNEL_ID=channel_id
ADMIN_ROLE=Minecraft Admin
```

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token (same as `discord.bot-token` in plugin config) |
| `CLIENT_ID` | Bot application ID (from Developer Portal) |
| `GUILD_ID` | Discord server ID |
| `MINECRAFT_API_URL` | Full URL of the plugin's REST API |
| `SECRET_TOKEN` | **Must exactly match** `bridge.secret-token` in `config.yml` |
| `CHAT_CHANNEL_ID` | Channel for chat bridge |
| `LOG_CHANNEL_ID` | Channel for log events |
| `ADMIN_ROLE` | Role name required for admin commands |

---

## Validation

On startup, the plugin checks for:

- `secret-token` not set or still `CHANGE_ME`
- `bot-api-url` empty
- `guild-id` empty
- `chat-channel-id` empty
- `api-port` out of range (1–65535)

Invalid values produce `[Config]` prefixed warnings in the console but do **not** prevent the plugin from starting.
