# Event Flow Diagram

> How Minecraft events travel from the game server to Discord channels.

---

## Overview

Every Minecraft event follows the same pattern:

1. Event fires on the Minecraft server
2. A **Listener** captures it
3. The data is formatted
4. An **async task** sends it to the bot via REST API
5. The bot posts it to the appropriate Discord channel

---

## Player Join Event

```mermaid
sequenceDiagram
    participant P as Player
    participant MC as Minecraft Server
    participant JL as JoinLeaveListener
    participant SC as Bukkit Scheduler
    participant BC as BotApiClient
    participant BA as Bot API (:3000)
    participant MQ as Message Queue
    participant DC as Discord Log Channel

    P->>MC: Connects to server
    MC->>JL: PlayerJoinEvent fired
    JL->>JL: Format: "🟢 **Steve** joined the server"
    JL->>SC: runTaskAsynchronously()
    SC->>BC: sendLogMessage(formatted)
    BC->>BA: POST /api/minecraft/log<br>X-Bridge-Token
    BA->>MQ: enqueueMessage()
    MQ->>DC: Send embed (rate limited)
    Note over DC: 🟢 Steve joined the server

    opt Voice Channels Enabled
        JL->>SC: runTaskAsynchronously()
        SC->>BC: createVoiceChannel("Steve", uuid)
        BC->>BA: POST /api/minecraft/voice<br>type: voice_create
        BA->>DC: Create voice channel
    end

    opt Stats Enabled
        JL->>JL: statsManager.handleJoin(player)
        Note over JL: Record join timestamp
    end
```

---

## Player Leave Event

```mermaid
sequenceDiagram
    participant P as Player
    participant MC as Minecraft Server
    participant JL as JoinLeaveListener
    participant BC as BotApiClient
    participant BOT as Discord Bot
    participant DC as Discord

    P->>MC: Disconnects
    MC->>JL: PlayerQuitEvent fired
    JL->>JL: Format: "🔴 **Steve** left the server"
    JL->>BC: sendLogMessage() [async]
    BC->>BOT: POST /api/minecraft/log
    BOT->>DC: Send to log channel

    opt Voice Channels Enabled
        JL->>BC: deleteVoiceChannel() [async]
        BC->>BOT: POST /api/minecraft/voice<br>type: voice_delete
        BOT->>BOT: Check cooldown (10s)
        BOT->>BOT: Check if channel empty
        BOT->>DC: Delete voice channel
    end

    opt Stats Enabled
        JL->>JL: statsManager.handleQuit(player)
        Note over JL: Calculate playtime delta
    end
```

---

## Chat Message Event

```mermaid
sequenceDiagram
    participant P as Player
    participant MC as Minecraft Server
    participant CL as ChatListener
    participant BC as BotApiClient
    participant BOT as Discord Bot
    participant DC as Discord Chat Channel

    P->>MC: Sends chat message "Hello!"
    MC->>CL: AsyncChatEvent fired
    CL->>CL: Serialize message with PlainTextComponentSerializer
    CL->>CL: Format: "[MC] **Steve**: Hello!"
    CL->>BC: sendChatMessage() [async]
    BC->>BC: Build JSON payload
    BC->>BOT: POST /api/minecraft/chat<br>with retry (3 attempts)

    alt Success
        BOT->>BOT: enqueueMessage()
        BOT->>DC: Send via webhook
        Note over DC: [MC] Steve: Hello!
    else Failure after 3 retries
        BC->>BC: Log SEVERE and drop
    end
```

---

## Death Event

```mermaid
sequenceDiagram
    participant P as Player
    participant MC as Minecraft Server
    participant DL as DeathListener
    participant SM as StatsManager
    participant BC as BotApiClient
    participant BOT as Discord Bot
    participant DC as Discord Log Channel

    P->>MC: Player dies
    MC->>DL: PlayerDeathEvent fired
    DL->>DL: Extract death message<br>"Steve was slain by Zombie"
    DL->>DL: Format: "☠ Steve was slain by Zombie"

    DL->>SM: incrementDeaths(player)
    opt PvP Kill
        DL->>SM: incrementKills(killer)
    end

    DL->>BC: sendLogMessage() [async]
    BC->>BOT: POST /api/minecraft/log
    BOT->>DC: Send death embed
    Note over DC: ☠ Steve was slain by Zombie
```

---

## Screenshot Event

```mermaid
sequenceDiagram
    participant P as Player
    participant PL as Plugin
    participant MR as MapRenderer
    participant BC as BotApiClient
    participant BOT as Discord Bot
    participant DM as Player's Discord DM

    P->>PL: /screenshot command
    PL->>PL: Check: feature enabled? account linked? cooldown?

    PL->>PL: Gather player data (main thread)
    PL->>MR: getBiomeName(location)
    PL->>MR: scanSurroundings(location)
    Note over MR: 11×11 block scan around player

    PL->>BC: sendScreenshot(data) [async thread]
    BC->>BOT: POST /api/minecraft/screenshot<br>Includes biome + nearbyBlocks
    BOT->>BOT: Build rich embed
    BOT->>DM: Send embed to player's DM
    BOT-->>BC: HTTP 200
    BC-->>PL: success = true
    PL->>P: "Screenshot sent to your Discord DMs!"
```

---

## Retry Behavior (All Events)

```mermaid
graph TD
    A[HTTP Request] --> B{Response OK?}
    B -->|200| C[Done ✅]
    B -->|Error / Timeout| D{Attempt < 3?}
    D -->|Yes| E[Wait: backoff]
    E --> A
    D -->|No| F[Log SEVERE ❌<br>Drop message]

    E -->|Attempt 2| G[Wait 1 second]
    E -->|Attempt 3| H[Wait 2 seconds]
```
