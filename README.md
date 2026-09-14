# Pure Note 📝

> Distraction-free, self-hosted ephemeral markdown scratchpad, daily journaling, and quick notes. Part of the **Pure** ecosystem.

## Features

- 📅 **1-Click Daily Notes**: Automatically create or open today's dated journal note (`YYYY-MM-DD`).
- 📋 **Persistent Scratchpad**: Always-available quick scratchpad for fleeting thoughts, clipboard items, and temporary snippets.
- ⚡ **Zero Database Footprint**: Saves notes as clean, raw `.md` files in `/data/notes/` and index in `/data/notes.json`. Compatible with Git and Pure Clone backups.
- 🎛️ **Dual/Split & Reading Modes**: Seamlessly toggle between Source Edit, Live Split View, and Distraction-Free Reading preview.
- ☑️ **Interactive Checklists**: Click checklist checkboxes in preview mode to toggle `- [ ]` and `- [x]` directly in markdown source.
- 🎨 **Pure Aesthetic Themes**: High-contrast Material 3 Dark, Material Light, Nord Dark, Nord Light, Dracula, Sunset, and Cyberpunk. Synced dynamically with Pure Hub.
- 🔍 **Instant Search & Hashtags**: Search across note titles, body text, and filter notes with `#tags`.
- 🔒 **Optional Password Gate**: Protect your notes with `APP_PASSWORD`.
- 🐳 **Lightweight Alpine Container**: Ultra-small Docker container with minimal memory usage.

---

## Quick Start

### Docker Run

```bash
docker run -d \
  --name pure-note \
  -p 3003:3000 \
  -e APP_PASSWORD="your-secure-password" \
  -v $(pwd)/data:/data \
  pure-note:latest
```

### Docker Compose

```yaml
services:
  pure-note:
    image: pure-note:latest
    container_name: pure-note
    ports:
      - "3003:3000"
    environment:
      - APP_PASSWORD=yourpassword
      - DATA_DIR=/data
    volumes:
      - ./data:/data
    restart: unless-stopped
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP Server Port | `3000` |
| `APP_PASSWORD` | Access gate password (optional) | *None (open)* |
| `DATA_DIR` | Directory for markdown files and metadata | `/data` |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev frontend (port 5174)
npm run dev

# 3. Start backend server (port 3000)
npm run start
```
