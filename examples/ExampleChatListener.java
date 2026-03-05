/**
 * PixelDisCraft — Example: Minecraft Event Listener
 *
 * This is a simplified example showing how a PaperMC plugin
 * can listen for chat events and forward them to an external API.
 *
 * NOTE: This is illustrative example code, not the full plugin implementation.
 */

package com.example.chatbridge;

import io.papermc.paper.event.player.AsyncChatEvent;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.plugin.java.JavaPlugin;

public class ExampleChatListener implements Listener {

    private final JavaPlugin plugin;

    public ExampleChatListener(JavaPlugin plugin) {
        this.plugin = plugin;
    }

    /**
     * Captures chat messages and forwards them to an external service.
     * Uses MONITOR priority to ensure the event is not cancelled by other plugins.
     */
    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlayerChat(AsyncChatEvent event) {
        // Extract player name and message
        String playerName = event.getPlayer().getName();
        String message = PlainTextComponentSerializer.plainText().serialize(event.message());

        // Format the outgoing message
        String formatted = String.format("[MC] **%s**: %s", playerName, message);

        // Send to external API off the main thread
        // AsyncChatEvent already runs async, but wrapping ensures safety
        plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
            sendToApi(formatted, playerName, message);
        });
    }

    /**
     * Sends the chat data to a REST API endpoint.
     * In a real implementation, this would use an HTTP client like OkHttp.
     */
    private void sendToApi(String formatted, String playerName, String rawMessage) {
        // Example payload structure:
        // {
        //   "type": "chat",
        //   "formattedMessage": "[MC] **Steve**: Hello!",
        //   "playerName": "Steve",
        //   "message": "Hello!"
        // }

        plugin.getLogger().info("Would send chat to API: " + formatted);

        // Actual implementation would:
        // 1. Build JSON payload
        // 2. Send HTTP POST with X-Bridge-Token authentication header
        // 3. Handle response / retry on failure with exponential backoff
    }
}
