# System Flow

> Complete data flow reference for every interaction path in PixelDisCraft.

---

## Flow Summary Table

| Flow | Direction | Trigger | Endpoint |
|------|-----------|---------|----------|
| Chat message | MC → Discord | Player sends chat | `POST /api/minecraft/chat` |
| Chat message | Discord → MC | User sends message in channel | `POST /api/discord/chat` |
| Player join | MC → Discord | Player joins server | `POST /api/minecraft/log` |
| Player leave | MC → Discord | Player leaves server | `POST /api/minecraft/log` |
| Death event | MC → Discord | Player dies | `POST /api/minecraft/log` |
| Server status | Discord → MC | `/server` command | `GET /api/server/status` |
| Player list | Discord → MC | `/players` command | `GET /api/server/status` |
| Console command | Discord → MC | `/mc` command | `POST /api/discord/command` |
| Kick player | Discord → MC | `/kick` command | `POST /api/discord/kick` |
| Ban player | Discord → MC | `/ban` command | `POST /api/discord/ban` |
| Link account | Discord → MC | `/link` command | `POST /api/discord/link` |
| Player stats | Discord → MC | `/stats` command | `GET /api/stats/:player` |
| Screenshot | MC → Discord | `/screenshot` in-game | `POST /api/minecraft/screenshot` |
| Voice create | MC → Discord | Player joins | `POST /api/minecraft/voice` |
| Voice delete | MC → Discord | Player leaves | `POST /api/minecraft/voice` |
| Role sync | MC → Discord | Account linked | `POST /api/minecraft/roles` |

---

## Detailed Flows

### 1. Minecraft → Discord Chat

```mermaid
graph TD
    A[Player sends chat in Minecraft] --> B[AsyncChatEvent fired]
    B --> C[ChatListener captures event]
    C --> D[Format message with template]
    D --> E[Schedule async task]
    E --> F[BotApiClient.sendChatMessage]
    F --> G{HTTP POST /api/minecraft/chat}
    G -->|Success| H[Bot sends webhook to Discord]
    G -->|Failure| I[Retry with exponential backoff]
    I -->|Max retries exceeded| J[Log SEVERE and drop]
    H --> K[Message appears in Discord channel]
```

### 2. Discord → Minecraft Chat

```mermaid
graph TD
    A[User sends message in Discord] --> B[messageCreate event]
    B --> C{Safety checks}
    C -->|Bot/Webhook/System| D[Ignore]
    C -->|Valid message| E[Trim to 256 chars]
    E --> F[HTTP POST /api/discord/chat]
    F --> G[Plugin receives on API thread]
    G --> H[Format with color codes]
    H --> I[Bukkit.broadcastMessage on main thread]
    I --> J[Message appears to all MC players]
```

### 3. Join / Leave

```mermaid
graph TD
    A[Player Join / Quit Event] --> B[Listener captures event]
    B --> C[Format notification message]
    C --> D[Async POST /api/minecraft/log]
    D --> E[Bot sends embed to log channel]

    B --> F{Voice channels enabled?}
    F -->|Yes, Join| G[POST voice_create]
    F -->|Yes, Leave| H[POST voice_delete]
    F -->|No| I[Skip]

    B --> J{Stats enabled?}
    J -->|Yes, Join| K[Record join time]
    J -->|Yes, Leave| L[Calculate + save playtime]
    J -->|No| I
```

### 4. Slash Command Execution

```mermaid
graph TD
    A[Admin uses /mc, /kick, or /ban] --> B[Discord sends interaction]
    B --> C[Bot validates admin role]
    C -->|No permission| D[Reply with error]
    C -->|Authorized| E[HTTP POST to plugin API]
    E --> F[Plugin validates X-Bridge-Token]
    F -->|Invalid| G[401 Unauthorized]
    F -->|Valid| H[Parse command payload]
    H --> I[Bukkit.dispatchCommand on main thread]
    I --> J[HTTP 200 returned]
    J --> K[Bot replies with success embed]
```

### 5. Account Linking (Full Round-Trip)

```mermaid
graph TD
    A[Player: /link in Minecraft] --> B[Generate 6-char code]
    B --> C[Store pending link with 5min expiry]
    C --> D[Display code to player]

    E[User: /link CODE in Discord] --> F[Bot POST /api/discord/link]
    F --> G[Plugin validates code]
    G -->|Invalid/Expired| H[Return error]
    G -->|Valid| I[Save permanent link to storage]
    I --> J[Notify MC player on main thread]
    I --> K[Return success to bot]
    K --> L[Bot replies in Discord]

    I --> M{Role sync enabled?}
    M -->|Yes| N[Async POST /api/minecraft/roles]
    N --> O[Bot assigns Discord roles]
    M -->|No| P[Done]
```

---

## Request / Response Examples

### Chat Payload (MC → Discord)

```json
{
  "type": "chat",
  "formattedMessage": "[MC] **Steve**: Hello everyone!",
  "playerName": "Steve",
  "message": "Hello everyone!"
}
```

### Command Payload (Discord → MC)

```json
{
  "command": "gamemode creative Steve",
  "executor": "AdminUser#1234"
}
```

### Server Status Response

```json
{
  "online": true,
  "players": 5,
  "maxPlayers": 20,
  "tps1m": 19.98,
  "tps5m": 19.95,
  "tps15m": 19.97,
  "ramUsedMB": 1024,
  "ramMaxMB": 4096,
  "playerList": ["Steve", "Alex", "Notch", "Jeb", "Dinnerbone"],
  "version": "git-Paper-496 (MC: 1.20.4)",
  "motd": "A Minecraft Server"
}
```

---

## Security at Every Step

Every API request includes:

```
X-Bridge-Token: <shared_secret>
```

If the token is missing or incorrect:
- HTTP 401 is returned immediately
- The unauthorized request is logged with source IP
- No command or message is processed
