# Changelog

All notable changes to PixelDisCraft will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-03-05

### Added

- **Chat Bridge** — Bi-directional Minecraft ↔ Discord chat via webhooks
- **Join / Leave Notifications** — Player connection events posted to Discord log channel
- **Death Messages** — In-game death events forwarded to Discord
- **Server Status** — `/server` slash command displaying TPS, RAM, player count, version
- **Player List** — `/players` slash command listing online players
- **Remote Commands** — `/mc`, `/kick`, `/ban` Discord slash commands with admin role gating
- **Account Linking** — `/link` command with 6-character time-limited codes
- **Role Sync** — Minecraft permission groups synced to Discord roles
- **Player Stats** — Kill, death, and playtime tracking via `/stats`
- **Screenshots** — Server-side player info snapshots sent to Discord DMs
- **Voice Channels** — Auto-created per-player voice channels on join/leave
- **REST API Bridge** — Secured with `X-Bridge-Token` header authentication
- **Retry System** — Exponential backoff (3 attempts) on failed HTTP calls
- **Rate Limiting** — Bot-side message queue throttled to 5 msg/sec
- **Config Validation** — Startup checks for missing or default configuration values
- **Structured Logging** — `[Category]` prefixed log output across all components

### Security

- All REST API endpoints require `X-Bridge-Token` header (not Bearer token)
- Unauthorized requests are logged with source IP
- Chat bridge hardened against webhook loops, oversized messages, and system messages

---

## [Unreleased]

_No unreleased changes._
