# Releases

This folder is a reference for the GitHub Releases system.

**Plugin JAR files are NOT stored in this folder.**

## How Releases Work

The compiled `PixelDisCraft-X.X.jar` plugin is distributed exclusively via
**[GitHub Releases](https://github.com/PGGAMER9911/PixelDisCraft/releases)**.

### Creating a Release

1. Build the plugin JAR locally using Maven:
   ```bash
   cd minecraft-plugin
   mvn clean package
   ```

2. Go to the GitHub repository → **Releases** → **Draft a new release**

3. Create a new tag (e.g., `v1.0.0`)

4. Upload the JAR file from `target/PixelDisCraft-1.0.jar`

5. Write release notes describing changes (reference CHANGELOG.md)

6. Publish the release

### Download Instructions (for Users)

1. Visit the [Releases page](https://github.com/PGGAMER9911/PixelDisCraft/releases)
2. Download the latest `PixelDisCraft-X.X.jar`
3. Place it in your Minecraft server's `plugins/` folder
4. Restart the server

---

> ⚠️ The plugin source code is NOT included in this repository.
> Only the compiled JAR is distributed via GitHub Releases.
