# Architecture

> How PixelDisCraft is designed, what each component does, and how they communicate.

---

## High-Level Overview

PixelDisCraft is a **two-service system** that connects a Minecraft PaperMC server with a Discord bot. The two services communicate over a private **REST API bridge** authenticated with a shared secret token.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PixelDisCraft System                        │
│                                                                     │
│  ┌─────────────────────┐        REST API        ┌────────────────┐ │
│  │  Minecraft Server   │◄──────────────────────►│  Discord Bot    │ │
│  │  + Plugin (Java)    │   X-Bridge-Token auth   │  (Node.js)     │ │
│  │  Port 8765          │                         │  Port 3000     │ │
│  └─────────────────────┘                         └────────────────┘ │
│         ▲                                              ▲            │
│         │                                              │            │
│    Minecraft                                       Discord          │
│    Players                                         Users            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### 1. PixelDisCraft Plugin (Java · PaperMC)

The plugin runs inside the Minecraft server process. It is responsible for:

| Responsibility | Details |
|---------------|---------|
| **Event Capture** | Listens for player chat, join, leave, death, and stat events |
| **REST API Server** | Runs an embedded HTTP server (Spark Java) on port 8765 to receive commands from the Discord bot |
| **Command Execution** | Receives kick, ban, and console commands from the bot and executes them on the main server thread |
| **Account Linking** | Manages link codes and stores Minecraft UUID ↔ Discord ID mappings |
| **Stats Tracking** | Records kills, deaths, playtime per player |
| **Data Storage** | Supports SQLite, MySQL, or flat JSON file storage |
| **Screenshot Capture** | Gathers player info, biome, and surrounding blocks for server-side "screenshots" |

**Key design rule:** All HTTP calls from the plugin are made **off the main thread** using Bukkit's async scheduler to prevent server lag.

### 2. PixelDisCraft Bot (Node.js · discord.js v14)

The bot is a standalone Node.js process. It is responsible for:

| Responsibility | Details |
|---------------|---------|
| **Slash Commands** | Registers and handles `/server`, `/players`, `/mc`, `/kick`, `/ban`, `/link`, `/stats` |
| **Chat Bridge** | Sends Minecraft chat to Discord via webhooks, sends Discord chat to Minecraft via API |
| **Log Channel** | Posts join/leave/death events to a designated Discord log channel |
| **Voice Channels** | Creates/deletes temporary voice channels per player |
| **Role Sync** | Applies Discord roles based on Minecraft permission groups |
| **REST API Server** | Runs an Express server on port 3000 to receive events from the plugin |
| **Rate Limiting** | Queues outbound Discord messages at 5 msg/sec to avoid Discord rate limits |

---

## REST API Bridge

All communication between the plugin and bot flows over HTTP:

### Plugin API (Port 8765) — Receives from Bot

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/discord/chat` | POST | Relay Discord chat message to Minecraft |
| `/api/discord/command` | POST | Execute a console command on the server |
| `/api/discord/kick` | POST | Kick a player |
| `/api/discord/ban` | POST | Ban a player |
| `/api/discord/link` | POST | Link a Discord account using a code |
| `/api/server/status` | GET | Get server status (TPS, RAM, players) |
| `/api/stats/:player` | GET | Get a player's stats |
| `/api/health` | GET | Health check |

### Bot API (Port 3000) — Receives from Plugin

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/minecraft/chat` | POST | Forward a Minecraft chat message to Discord |
| `/api/minecraft/log` | POST | Forward a log event (join/leave/death) |
| `/api/minecraft/screenshot` | POST | Send screenshot data to Discord DM |
| `/api/minecraft/voice` | POST | Create or delete a voice channel |
| `/api/minecraft/roles` | POST | Trigger role sync for a player |

---

## Security

### Token Authentication

Every API request must include an `X-Bridge-Token` header containing a shared secret:

```
X-Bridge-Token: your_secret_token_here
```

- The token is configured in both `config.yml` (plugin) and `.env` (bot)
- Unauthorized requests receive HTTP 401 and are logged with the source IP
- The token is **never** sent as a Bearer token or query parameter

### Input Validation

- Chat messages are trimmed to 256 characters max
- Webhook and bot messages are ignored to prevent loopback
- Discord system messages and empty content are filtered out

---

## Async Communication

The plugin **never** makes HTTP calls on the Minecraft main thread:

```
Main Thread                    Async Thread
    │                               │
    │  Event fires (chat, join)     │
    │──────────────────────────────►│
    │                               │  HTTP POST to bot API
    │                               │  (with retry + backoff)
    │                               │
    │  Bukkit.runTask()   ◄─────────│  Response received
    │  (back to main thread)        │
```

This ensures zero server lag from Discord communication, even if the bot is slow or unreachable.

### Retry System

Failed HTTP calls retry up to **3 times** with exponential backoff:

| Attempt | Delay Before Retry |
|---------|-------------------|
| 1st | Immediate |
| 2nd | 1 second |
| 3rd | 2 seconds |

After 3 failures, the request is logged as `SEVERE` and dropped.

---

## Data Flow Summary

```mermaid
graph LR
    subgraph Minecraft Side
        E[Event Listener] --> B[BotApiClient]
        B --> |Async + Retry| RA[REST API]
    end

    subgraph Discord Side
        RA --> H[Express Handler]
        H --> Q[Message Queue]
        Q --> |Rate Limited| D[Discord API]
    end

    subgraph Discord → Minecraft
        SC[Slash Command] --> BA[Bot API Client]
        BA --> |X-Bridge-Token| PA[Plugin API]
        PA --> |Main Thread| MC[Minecraft Server]
    end
```
