/**
 * PixelDisCraft — Example: REST API Request Patterns
 *
 * This file demonstrates how the Discord bot communicates with the
 * Minecraft plugin's REST API. All requests require an X-Bridge-Token header.
 *
 * NOTE: This is illustrative example code, not the full bot implementation.
 */

const axios = require('axios');

// ── Configuration ──────────────────────────────────────────
const API_BASE = 'http://localhost:8765';
const SECRET_TOKEN = 'your_shared_secret_token';

// Reusable Axios instance with auth header
const api = axios.create({
    baseURL: API_BASE,
    timeout: 5000,
    headers: {
        'X-Bridge-Token': SECRET_TOKEN,
        'Content-Type': 'application/json',
    },
});


// ── Example 1: Get Server Status ───────────────────────────
async function getServerStatus() {
    try {
        const response = await api.get('/api/server/status');
        const status = response.data;

        console.log(`Server: ${status.version}`);
        console.log(`Players: ${status.players}/${status.maxPlayers}`);
        console.log(`TPS: ${status.tps1m}`);
        console.log(`RAM: ${status.ramUsedMB}/${status.ramMaxMB} MB`);
        console.log(`Online: ${status.playerList.join(', ')}`);

        return status;
    } catch (error) {
        console.error('Failed to fetch server status:', error.message);
        return null;
    }
}


// ── Example 2: Send Chat Message to Minecraft ──────────────
async function sendChatToMinecraft(username, message) {
    try {
        await api.post('/api/discord/chat', {
            user: username,
            message: message,
        });
        console.log(`Chat sent: ${username}: ${message}`);
    } catch (error) {
        console.error('Failed to send chat:', error.message);
    }
}


// ── Example 3: Execute Console Command ─────────────────────
async function executeCommand(command, executor) {
    try {
        const response = await api.post('/api/discord/command', {
            command: command,
            executor: executor,
        });
        console.log(`Command executed: ${command} (by ${executor})`);
        return response.data;
    } catch (error) {
        console.error('Failed to execute command:', error.message);
        return null;
    }
}


// ── Example 4: Kick a Player ───────────────────────────────
async function kickPlayer(playerName, reason) {
    try {
        await api.post('/api/discord/kick', {
            player: playerName,
            reason: reason || 'Kicked from Discord',
        });
        console.log(`Kicked: ${playerName} (${reason})`);
    } catch (error) {
        console.error('Failed to kick player:', error.message);
    }
}


// ── Example 5: Ban a Player ────────────────────────────────
async function banPlayer(playerName, reason) {
    try {
        await api.post('/api/discord/ban', {
            player: playerName,
            reason: reason || 'Banned from Discord',
        });
        console.log(`Banned: ${playerName} (${reason})`);
    } catch (error) {
        console.error('Failed to ban player:', error.message);
    }
}


// ── Example 6: Link Account ───────────────────────────────
async function linkAccount(code, discordId) {
    try {
        const response = await api.post('/api/discord/link', {
            code: code,
            discordId: discordId,
        });

        if (response.data.success) {
            console.log(`Account linked: Discord ${discordId}`);
        } else {
            console.log(`Link failed: ${response.data.error}`);
        }

        return response.data;
    } catch (error) {
        console.error('Failed to link account:', error.message);
        return null;
    }
}


// ── Example 7: Get Player Stats ────────────────────────────
async function getPlayerStats(playerName) {
    try {
        const response = await api.get(`/api/stats/${playerName}`);
        const stats = response.data;

        console.log(`Stats for ${playerName}:`);
        console.log(`  Kills: ${stats.kills || 0}`);
        console.log(`  Deaths: ${stats.deaths || 0}`);
        console.log(`  Playtime: ${Math.floor((stats.playtimeSeconds || 0) / 3600)}h`);

        return stats;
    } catch (error) {
        if (error.response?.status === 404) {
            console.log(`Player not found: ${playerName}`);
        } else {
            console.error('Failed to fetch stats:', error.message);
        }
        return null;
    }
}


// ── Example 8: Health Check ────────────────────────────────
async function healthCheck() {
    try {
        const response = await api.get('/api/health');
        console.log('Server healthy:', response.data.status === 'ok');
        return true;
    } catch (error) {
        console.log('Server unreachable');
        return false;
    }
}


// ── Run Examples ───────────────────────────────────────────
(async () => {
    console.log('=== PixelDisCraft API Examples ===\n');

    await healthCheck();
    await getServerStatus();
    await getPlayerStats('Steve');

    // Uncomment to test write operations:
    // await sendChatToMinecraft('ExampleUser', 'Hello from the API!');
    // await executeCommand('say Hello World', 'APITest');
    // await kickPlayer('Griefer', 'Testing kick');
    // await linkAccount('A3K9X2', '123456789012345678');
})();
