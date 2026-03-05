/**
 * PixelDisCraft — Example: Discord Chat Bridge Handler
 *
 * This is a simplified example showing how a discord.js bot
 * can forward Discord messages to a Minecraft server via REST API.
 *
 * NOTE: This is illustrative example code, not the full bot implementation.
 */

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Configuration (in production, loaded from .env)
const CONFIG = {
    discordToken: 'YOUR_BOT_TOKEN',
    chatChannelId: 'YOUR_CHANNEL_ID',
    minecraftApiUrl: 'http://localhost:8765',
    secretToken: 'YOUR_SECRET_TOKEN',
};

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

/**
 * Listen for messages in the chat bridge channel and forward to Minecraft.
 */
client.on('messageCreate', async (message) => {
    // ── Safety Guards ──────────────────────────────────────
    // Ignore bots, webhooks, and system messages
    if (message.author.bot) return;
    if (message.webhookId) return;
    if (message.system) return;

    // Only listen in the configured chat channel
    if (message.channel.id !== CONFIG.chatChannelId) return;

    // Ignore empty messages (attachments only, embeds only)
    const content = message.content?.trim();
    if (!content || content.length === 0) return;

    // Trim extremely long messages
    const trimmedContent = content.length > 256
        ? content.substring(0, 253) + '...'
        : content;

    // ── Send to Minecraft ──────────────────────────────────
    try {
        await axios.post(
            `${CONFIG.minecraftApiUrl}/api/discord/chat`,
            {
                user: message.member?.displayName || message.author.username,
                message: trimmedContent,
            },
            {
                headers: {
                    'X-Bridge-Token': CONFIG.secretToken,
                    'Content-Type': 'application/json',
                },
                timeout: 5000,
            }
        );

        console.log(`[ChatBridge] Forwarded message from ${message.author.tag}`);
    } catch (error) {
        console.error(`[ChatBridge] Failed to forward message: ${error.message}`);
    }
});

/**
 * Example: Receive a Minecraft chat message via Express and send to Discord.
 *
 * In the full implementation, an Express server listens for POST requests
 * from the Minecraft plugin and sends them to Discord via webhook.
 */
// app.post('/api/minecraft/chat', authenticate, async (req, res) => {
//     const { formattedMessage, playerName } = req.body;
//     const channel = client.channels.cache.get(CONFIG.chatChannelId);
//     if (channel) {
//         await channel.send(formattedMessage);
//     }
//     res.json({ status: 'ok' });
// });

client.login(CONFIG.discordToken);
