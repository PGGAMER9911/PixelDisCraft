# System Architecture Diagram

> Visual overview of every component in the PixelDisCraft system and how they connect.

---

## Full System Architecture

```mermaid
graph TB
    subgraph Internet
        DISCORD_API[Discord API<br>gateway.discord.gg]
    end

    subgraph "Host Machine"
        subgraph "Minecraft Server Process"
            MC_CORE[Minecraft Server<br>PaperMC 1.20.4]
            PLUGIN[PixelDisCraft Plugin<br>Java 17]
            LISTENERS[Event Listeners<br>Chat · Join · Death · Stats]
            COMMANDS_MC[MC Commands<br>/link · /screenshot]
            STORAGE[(Storage Layer<br>SQLite / MySQL / JSON)]
            API_SERVER[Plugin REST API<br>Spark Java · Port 8765]
            BOT_CLIENT[BotApiClient<br>OkHttp + Retry]
        end

        subgraph "Discord Bot Process"
            BOT_CORE[PixelDisCraft Bot<br>Node.js 18 · discord.js v14]
            SLASH_CMDS[Slash Commands<br>/server · /mc · /kick · /ban<br>/link · /stats · /players]
            MSG_HANDLER[Message Handler<br>Chat Bridge · Guards]
            EXPRESS[Bot REST API<br>Express · Port 3000]
            MSG_QUEUE[Message Queue<br>Rate Limited · 5 msg/sec]
        end
    end

    MC_CORE --> PLUGIN
    PLUGIN --> LISTENERS
    PLUGIN --> COMMANDS_MC
    PLUGIN --> STORAGE
    PLUGIN --> API_SERVER
    PLUGIN --> BOT_CLIENT

    LISTENERS --> BOT_CLIENT
    BOT_CLIENT -- "POST /api/minecraft/*<br>X-Bridge-Token" --> EXPRESS

    EXPRESS --> BOT_CORE
    BOT_CORE --> MSG_QUEUE
    MSG_QUEUE --> DISCORD_API

    DISCORD_API --> BOT_CORE
    BOT_CORE --> SLASH_CMDS
    BOT_CORE --> MSG_HANDLER

    SLASH_CMDS -- "POST /api/discord/*<br>X-Bridge-Token" --> API_SERVER
    MSG_HANDLER -- "POST /api/discord/chat<br>X-Bridge-Token" --> API_SERVER

    API_SERVER --> PLUGIN

    style MC_CORE fill:#4CAF50,color:#fff,stroke:#388E3C
    style PLUGIN fill:#2196F3,color:#fff,stroke:#1565C0
    style BOT_CORE fill:#5865F2,color:#fff,stroke:#4752C4
    style DISCORD_API fill:#5865F2,color:#fff,stroke:#4752C4
    style API_SERVER fill:#FF9800,color:#fff,stroke:#E65100
    style EXPRESS fill:#FF9800,color:#fff,stroke:#E65100
    style STORAGE fill:#9E9E9E,color:#fff,stroke:#616161
    style MSG_QUEUE fill:#F44336,color:#fff,stroke:#C62828
```

---

## Component Legend

| Color | Component Type |
|-------|---------------|
| 🟢 Green | Minecraft Server |
| 🔵 Blue | PixelDisCraft Plugin / Bot |
| 🟠 Orange | REST API Endpoints |
| 🔴 Red | Rate Limiter / Queue |
| ⚪ Grey | Storage Layer |
| 🟣 Purple | Discord API |

---

## Network Ports

```mermaid
graph LR
    subgraph "Port 8765"
        A[Plugin REST API]
    end

    subgraph "Port 3000"
        B[Bot REST API]
    end

    subgraph "Port 443"
        C[Discord Gateway<br>wss://]
    end

    A <-- "HTTP<br>X-Bridge-Token" --> B
    B <-- "WebSocket<br>Bot Token" --> C
```

---

## Security Boundaries

```mermaid
graph TB
    subgraph "Trusted Zone (Same Host)"
        P[Plugin API :8765]
        B[Bot API :3000]
        P <-- "X-Bridge-Token" --> B
    end

    subgraph "External (Internet)"
        D[Discord API]
    end

    B -- "Bot Token<br>WSS :443" --> D

    subgraph "Untrusted"
        U[Unknown Requests]
    end

    U -. "No token" .-> P
    P -- "401 Unauthorized" --> U

    style P fill:#4CAF50,color:#fff
    style B fill:#2196F3,color:#fff
    style D fill:#5865F2,color:#fff
    style U fill:#F44336,color:#fff
```
