# Command Flow Diagram

> How Discord slash commands travel from Discord to the Minecraft server and back.

---

## Overview

All Discord → Minecraft commands follow this pattern:

1. Admin uses a slash command in Discord
2. Bot validates permissions
3. Bot sends an authenticated HTTP request to the plugin's REST API
4. Plugin executes the action on the Minecraft main thread
5. Plugin returns a response
6. Bot displays the result to the admin

---

## `/mc` — Execute Console Command

```mermaid
sequenceDiagram
    participant A as Admin
    participant DC as Discord
    participant BOT as PixelDisCraft Bot
    participant AUTH as Auth Middleware
    participant API as Plugin REST API
    participant PL as Plugin
    participant MC as Minecraft Console

    A->>DC: /mc command "gamemode creative Steve"
    DC->>BOT: Interaction received

    BOT->>BOT: Check admin role
    alt Missing admin role
        BOT-->>DC: "❌ You need the Minecraft Admin role"
    end

    BOT->>API: POST /api/discord/command<br>X-Bridge-Token: secret<br>{"command":"gamemode creative Steve","executor":"Admin#1234"}

    API->>AUTH: Validate X-Bridge-Token
    alt Invalid token
        AUTH-->>BOT: 401 Unauthorized
        BOT-->>DC: "❌ Authentication failed"
    end

    AUTH->>PL: Route to handler
    PL->>PL: Log: "[API] [Command] Admin#1234 executed: gamemode creative Steve"
    PL->>MC: Bukkit.dispatchCommand() on main thread
    MC-->>PL: Command executed

    PL-->>BOT: {"status":"ok","message":"Command executed"}
    BOT-->>DC: "✅ Command executed: `gamemode creative Steve`"
```

---

## `/server` — Server Status

```mermaid
sequenceDiagram
    participant U as User
    participant DC as Discord
    participant BOT as Bot
    participant API as Plugin API

    U->>DC: /server
    DC->>BOT: Interaction

    BOT->>API: GET /api/server/status<br>X-Bridge-Token
    API-->>BOT: JSON response

    Note over BOT: Build embed with:<br>• Players: 5/20<br>• TPS: 19.98<br>• RAM: 1024/4096 MB<br>• Version: Paper 1.20.4

    BOT-->>DC: Rich embed
```

---

## `/players` — Online Player List

```mermaid
sequenceDiagram
    participant U as User
    participant DC as Discord
    participant BOT as Bot
    participant API as Plugin API

    U->>DC: /players
    DC->>BOT: Interaction

    BOT->>API: GET /api/server/status<br>X-Bridge-Token
    API-->>BOT: {"playerList":["Steve","Alex","Notch"],...}

    Note over BOT: Build embed:<br>🎮 Online Players (3)<br>• Steve<br>• Alex<br>• Notch

    BOT-->>DC: Player list embed
```

---

## `/kick` — Kick Player

```mermaid
sequenceDiagram
    participant A as Admin
    participant DC as Discord
    participant BOT as Bot
    participant API as Plugin API
    participant MC as Minecraft

    A->>DC: /kick Steve "Breaking rules"
    DC->>BOT: Interaction
    BOT->>BOT: Validate admin role ✅

    BOT->>API: POST /api/discord/kick<br>{"player":"Steve","reason":"Breaking rules"}
    API->>MC: Bukkit.dispatchCommand("kick Steve Breaking rules")<br>on main thread

    MC-->>API: Executed
    API-->>BOT: {"status":"ok"}
    BOT-->>DC: "✅ Steve has been kicked.<br>Reason: Breaking rules"
```

---

## `/ban` — Ban Player

```mermaid
sequenceDiagram
    participant A as Admin
    participant DC as Discord
    participant BOT as Bot
    participant API as Plugin API
    participant MC as Minecraft

    A->>DC: /ban Griefer "Griefing base"
    DC->>BOT: Interaction
    BOT->>BOT: Validate admin role ✅

    BOT->>API: POST /api/discord/ban<br>{"player":"Griefer","reason":"Griefing base"}
    API->>MC: Bukkit.dispatchCommand("ban Griefer Griefing base")<br>on main thread

    MC-->>API: Executed
    API-->>BOT: {"status":"ok"}
    BOT-->>DC: "✅ Griefer has been banned.<br>Reason: Griefing base"
```

---

## `/stats` — Player Statistics

```mermaid
sequenceDiagram
    participant U as User
    participant DC as Discord
    participant BOT as Bot
    participant API as Plugin API
    participant DB as Storage

    U->>DC: /stats Steve
    DC->>BOT: Interaction

    BOT->>API: GET /api/stats/Steve<br>X-Bridge-Token
    API->>DB: Query stats for "Steve"
    DB-->>API: Stats data

    API-->>BOT: {"kills":42,"deaths":7,"playtime":86400,...}

    Note over BOT: Build embed:<br>📊 Steve's Stats<br>⚔ Kills: 42<br>☠ Deaths: 7<br>⏱ Playtime: 1d 0h 0m

    BOT-->>DC: Stats embed
```

---

## `/link` — Account Linking

```mermaid
sequenceDiagram
    participant U as Discord User
    participant DC as Discord
    participant BOT as Bot
    participant API as Plugin API
    participant PL as Plugin
    participant DB as Storage
    participant P as MC Player

    U->>DC: /link A3K9X2
    DC->>BOT: Interaction

    BOT->>API: POST /api/discord/link<br>{"code":"A3K9X2","discordId":"123456789"}

    API->>PL: Validate code
    alt Code invalid or expired
        PL-->>BOT: {"success":false,"error":"Invalid or expired code"}
        BOT-->>DC: "❌ Invalid or expired code"
    end

    PL->>DB: Save link (UUID ↔ Discord ID)
    PL->>P: Notify in-game: "Your account has been linked!"

    opt Role Sync Enabled
        PL->>BOT: POST /api/minecraft/roles (async)
        BOT->>DC: Assign Discord roles
    end

    PL-->>BOT: {"success":true}
    BOT-->>DC: "✅ Account linked to Steve!"
```

---

## Error Handling Flow (All Commands)

```mermaid
graph TD
    A[Slash Command] --> B{Admin check needed?}
    B -->|Yes| C{Has admin role?}
    C -->|No| D["❌ Permission denied"]
    C -->|Yes| E[Send API request]
    B -->|No| E

    E --> F{API reachable?}
    F -->|No| G["❌ Could not reach Minecraft server"]
    F -->|Yes| H{Token valid?}
    H -->|No| I["❌ Authentication error"]
    H -->|Yes| J{Action successful?}
    J -->|No| K["❌ Action failed + error message"]
    J -->|Yes| L["✅ Success embed"]
```
