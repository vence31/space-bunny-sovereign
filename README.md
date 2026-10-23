# 🐰 Space Bunny Sovereign (SBH)

> **High-Performance Sovereign AI Runtime & Intelligent Copilot Model Router**  
> Features GitHub Copilot-style Dynamic Local Model Routing, Live Web Research, YouTube Transcript Extraction, Real-Time Streaming Speech (Microsoft AI Natural Voices), Persistent Agent Memory (MEMORIA), and Self-Evolution v2.0.

---

## 🌟 Key Features

1. **🎯 Copilot Intelligent Local Model Routing**
   - Automatically classifies tasks and routes to the optimal local model:
     - **Coding & Architecture:** `qwen2.5-coder:7b` (32k context, tool calling)
     - **Deep Algorithmic CoT:** `deepseek-r1:8b` (step-by-step logic proofs)
     - **Fast Conversational & Web:** `llama3.2:3b` (ultra-fast responses)
   - Dynamic auto-discovery of locally installed Ollama and LM Studio models.

2. **🌐 Real-Time Web Research & YouTube Transcripts**
   - **Dual-Path Network Connectivity:** Combines lightweight TCP socket probing with automatic HTTPS failover to ensure reliable connectivity on all networks.
   - **Dual-Engine Search:** DuckDuckGo Lite via POST (primary, bot-wall immune) with HTML GET fallback.
   - **YouTube Video & Transcript Extractor:** Direct spoken audio transcript parsing with CP1252 unicode protection and 25,000-character evidence drawers.
   - **Truthful Status Reporting:** Distinguishes between self-contained local queries (`ONLINE — RESEARCH NOT NEEDED`), active live searches, and graceful offline fallback (`OFFLINE — LOCAL MODE` / `SEARCH FAILED — LOCAL FALLBACK`).

3. **🔊 Hands-Free Read-Aloud & Streaming Speech**
   - Real-time sentence chunking (`/[.!?]\s*$/`) that begins speaking as sentences arrive without waiting for the full response.
   - Prioritized voice hierarchy with Microsoft AI Natural Voices (`Microsoft Aria Online`, `Jenny`, `Guy`, `Christopher`, etc.).
   - Automatic filtering of code blocks, URLs, and markdown punctuation from audio narration.

4. **🧠 ClawHub MEMORIA & Autonomous Evolution v2.0**
   - Multi-layer persistent agent memory stored locally in `/memory`.
   - Continuous self-evolution ledger tracking generation fitness and autonomous prompt adaptation.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on v24)
- [Ollama](https://ollama.com/) with models installed:
  ```bash
  ollama run llama3.2:3b
  ollama run qwen2.5-coder:7b
  ollama run deepseek-r1:8b
  ```
- Python 3.9+ (with `youtube-transcript-api` if using YouTube transcript parsing):
  ```bash
  pip install youtube-transcript-api
  ```

### Installation & Launch
```bash
git clone https://github.com/vence31/space-bunny-sovereign.git
cd space-bunny-sovereign
npm install
npm start
```
The dashboard will be available at: **`http://localhost:3090`**

---

## 📱 How to Access & Test on Your Cell Phone

### Option A: Local Wi-Fi (Fastest, Same Network)
1. Ensure your cell phone is connected to the same Wi-Fi network as your computer.
2. Find your computer's local Wi-Fi IP address (run `ipconfig` in PowerShell/CMD, e.g. `10.0.0.88` or `192.168.1.xxx`).
3. Open Safari (iOS) or Chrome (Android) on your phone and go to:
   ```text
   http://<YOUR_COMPUTER_IP>:3090
   ```
   *(e.g., `http://10.0.0.88:3090`)*

### Option B: Remote / Cellular Access (Cloudflare Tunnel)
If you want to test from anywhere outside your home Wi-Fi:
```bash
# Using free Cloudflare Tunnel (no account required)
npx localtunnel --port 3090
# OR
cloudflared tunnel --url http://localhost:3090
```
This generates a secure public HTTPS URL that you can open from any mobile browser on cellular data.

---

## 🛠️ API Reference

- `GET  /api/network-status` — Real-time TCP + HTTPS connectivity probe and latency.
- `GET  /api/models` — Dynamic model discovery from Ollama and LM Studio.
- `POST /api/chat` — Network-aware chat endpoint supporting SSE streaming (`text/event-stream`).
- `GET  /api/memory` / `POST /api/memory` — Read and write persistent MEMORIA vaults.
- `GET  /api/evolution` / `POST /api/evolution` — Autonomous self-evolution state and ledger.

---

## 📜 License
MIT License. Created by VCS Sovereign Command Center.
