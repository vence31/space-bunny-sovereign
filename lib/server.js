import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ContextManager } from './context.js';
import { ProviderDispatcher } from './dispatcher.js';
import { ToolRunner, checkInternet } from './tools.js';
import { NetworkAwareRouter } from './router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer(config = {}) {
  const app = express();
  const server = http.createServer(app);
  const port = config.harness?.port || 3090;

  const contextMgr = new ContextManager(config.context || {});
  const dispatcher = new ProviderDispatcher(config);
  const toolRunner = new ToolRunner();
  const router = new NetworkAwareRouter({ dispatcher, toolRunner, contextMgr, config });

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // In-memory active session store
  const sessions = new Map();

  // Network health check endpoint
  // Network Status Heartbeat Endpoint with Unified TCP + HTTPS Dual Probe
  app.get('/api/network-status', async (req, res) => {
    const start = Date.now();
    try {
      const isOnline = await checkInternet();
      const latency = Date.now() - start;

      res.json({
        online: isOnline,
        tested: true,
        httpProbe: 'https://www.microsoft.com (with port 53 fallback)',
        httpStatus: isOnline ? '200 OK' : 'Probe Failed',
        latencyMs: latency,
        searchProvider: 'DuckDuckGo Live Search',
        searchActive: isOnline,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      res.json({
        online: false,
        tested: true,
        error: e.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Dynamic Model Discovery Endpoint (GitHub Copilot style)
  app.get('/api/models', async (req, res) => {
    try {
      const models = await dispatcher.discoverModels();
      res.json({ models });
    } catch (e) {
      res.json({ models: [] });
    }
  });

  // Persistent Memory Vault Endpoints (MEMORIA & Memory-Toolkit)
  app.get('/api/memory', (req, res) => {
    try {
      res.json(router.memoryEngine.getAllMemory());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/memory', (req, res) => {
    try {
      const { file, content, category, text, context } = req.body;
      if (file && content !== undefined) {
        const targetPath = path.join(router.memoryEngine.memoryDir, path.basename(file));
        fs.writeFileSync(targetPath, content, 'utf-8');
        return res.json({ success: true, file, message: 'Memory file saved successfully' });
      }
      if (text) {
        const result = router.memoryEngine.saveMemoryItem({ category, text, context });
        return res.json(result);
      }
      res.status(400).json({ error: 'Missing file/content or text' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Self-Evolution Endpoints (ClawHub self-evolution v2.0)
  app.get('/api/evolution', (req, res) => {
    try {
      res.json({
        state: router.evolutionEngine.getState(),
        ledger: router.evolutionEngine.getLedger()
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/evolution', async (req, res) => {
    try {
      const result = await router.evolutionEngine.runEvolutionCycle(req.body);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Root Web UI (Navy, Gold & Black, Copilot Auto-Routing, Live SSE Streaming)
  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VCS Sovereign • Copilot Intelligent Routing</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #000000;
      --panel: #071331;
      --card-bg: #0b1d44;
      --border: #1c3a73;
      --border-focus: #d4af37;
      --accent: #d4af37;
      --accent-hover: #b8912a;
      --accent-glow: rgba(212,175,55, 0.22);
      --online-blue: #e8c766;
      --text: #f1f5f9;
      --text-muted: #8292a6;
      --user-bubble: #0d2250;
      --user-border: #234a8f;
      --radius: 12px;
      --radius-sm: 8px;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      height: 100vh;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    #sidebar {
      width: 320px;
      background: var(--panel);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 20px;
      gap: 16px;
      z-index: 10;
    }
    .brand-title {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
    }
    .brand-pill {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 3px 8px;
      border-radius: 20px;
      background: var(--accent-glow);
      color: var(--accent);
      border: 1px solid var(--accent);
    }
    .btn-new-session {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      height: 40px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-new-session:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--accent);
      color: #fff;
    }
    .section-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .model-select {
      background: #020814;
      color: #fff;
      border: 1px solid var(--border);
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      width: 100%;
      font-size: 13px;
      font-weight: 500;
      outline: none;
      transition: border-color 0.2s;
    }
    .model-select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px var(--accent-glow);
    }
    .context-meter-box {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .meter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    .meter-label {
      font-weight: 600;
      color: #fff;
    }
    .meter-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--accent);
    }
    .progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      width: 0.1%;
      background: linear-gradient(90deg, var(--accent) 0%, #f0c75e 100%);
      transition: width 0.4s ease;
    }
    .tool-bento {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
    }
    .bento-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .bento-card-title {
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .bento-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(212,175,55, 0.1);
      color: var(--accent);
      border: 1px solid rgba(212,175,55, 0.3);
    }
    .bento-tools {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .tool-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      color: #cbd5e1;
    }
    #main-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: relative;
    }
    #top-header {
      height: 64px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      background: rgba(7,19,49, 0.85);
      backdrop-filter: blur(12px);
      z-index: 5;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .engine-status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 20px;
      background: rgba(212,175,55, 0.08);
      border: 1px solid rgba(212,175,55, 0.3);
      color: var(--accent);
      transition: all 0.3s;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
      animation: pulse 2s infinite;
    }
    .pulse-dot.offline {
      background: #64748b;
      box-shadow: none;
      animation: none;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(212,175,55, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(212,175,55, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(212,175,55, 0); }
    }
    #chat-box {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .message-row {
      display: flex;
      flex-direction: column;
      max-width: 860px;
      width: 100%;
      margin: 0 auto;
      gap: 8px;
    }
    .user-row {
      align-items: flex-end;
    }
    .assistant-row {
      align-items: flex-start;
    }
    .bubble {
      padding: 16px 20px;
      border-radius: var(--radius);
      font-size: 14.5px;
      line-height: 1.65;
      max-width: 85%;
      word-break: break-word;
    }
    .user-bubble {
      background: var(--user-bubble);
      border: 1px solid var(--user-border);
      color: #fff;
      border-bottom-right-radius: 2px;
    }
    .assistant-bubble {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: #e2e8f0;
      border-bottom-left-radius: 2px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      width: 100%;
    }
    .badge-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .source-mode-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 12px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .pill-web-verified {
      background: rgba(212,175,55, 0.12);
      border: 1px solid rgba(212,175,55, 0.4);
      color: var(--accent);
    }
    .pill-web-partial {
      background: rgba(240,199,94, 0.12);
      border: 1px solid rgba(240,199,94, 0.4);
      color: #f0c75e;
    }
    .pill-doc-analysis {
      background: rgba(91,127,209, 0.15);
      border: 1px solid rgba(91,127,209, 0.4);
      color: #8fb0ff;
    }
    .pill-local-only {
      background: rgba(148, 163, 184, 0.1);
      border: 1px solid rgba(148, 163, 184, 0.25);
      color: #94a3b8;
    }
    .pill-copilot-route {
      background: rgba(91,127,209, 0.12);
      border: 1px solid rgba(91,127,209, 0.4);
      color: #8fb0ff;
    }
    .pill-model-unavailable {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #f87171;
    }
    .evidence-accordion {
      margin-top: 10px;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      font-size: 12px;
    }
    .evidence-summary {
      padding: 8px 12px;
      cursor: pointer;
      font-weight: 600;
      color: var(--accent);
      user-select: none;
    }
    .evidence-content {
      padding: 10px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      line-height: 1.5;
      color: #cbd5e1;
      max-height: 200px;
      overflow-y: auto;
    }
    .live-status-line {
      font-size: 12px;
      color: var(--accent);
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .code-block {
      background: #010308;
      border: 1px solid #1c3a73;
      border-radius: 6px;
      padding: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      margin: 10px 0;
      overflow-x: auto;
      color: #e2e8f0;
    }
    .tool-capsule {
      margin-top: 10px;
      background: #020814;
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      border-radius: 6px;
      padding: 8px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #cbd5e1;
    }
    #input-dock {
      padding: 18px 28px 24px 28px;
      background: linear-gradient(180deg, transparent 0%, var(--bg) 20%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .input-wrapper {
      max-width: 860px;
      width: 100%;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .input-wrapper:focus-within {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    #prompt-input {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14.5px;
      line-height: 1.5;
      resize: none;
      min-height: 52px;
      max-height: 200px;
    }
    .dock-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .input-meta-text {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-send {
      background: var(--accent);
      color: #000000;
      border: none;
      border-radius: var(--radius-sm);
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-send:hover {
      background: var(--accent-hover);
      box-shadow: 0 0 14px var(--accent-glow);
      transform: translateY(-1px);
    }
    /* Persistent Memory Modal */
    #memory-modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0, 0.78);
      backdrop-filter: blur(6px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    #memory-modal {
      width: 780px;
      max-width: 90vw;
      height: 600px;
      max-height: 85vh;
      background: var(--panel);
      border: 1px solid var(--accent);
      border-radius: var(--radius);
      box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 25px var(--accent-glow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--card-bg);
    }
    .modal-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--accent);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .modal-tabs {
      display: flex;
      background: #050f2b;
      border-bottom: 1px solid var(--border);
      padding: 6px 16px 0;
      gap: 8px;
    }
    .modal-tab-btn {
      background: transparent;
      border: 1px solid transparent;
      border-bottom: none;
      color: var(--text-muted);
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 6px 6px 0 0;
      font-family: 'JetBrains Mono', monospace;
    }
    .modal-tab-btn.active {
      background: var(--panel);
      color: var(--accent);
      border-color: var(--border);
      border-bottom: 2px solid var(--accent);
    }
    .modal-body {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: hidden;
    }
    .memory-textarea {
      flex: 1;
      background: #000000;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      padding: 12px;
      resize: none;
      outline: none;
      line-height: 1.5;
    }
    .memory-textarea:focus {
      border-color: var(--accent);
    }
    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border);
      background: var(--card-bg);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Mobile Responsive Layout (Phones & Tablets) */
    .mobile-menu-btn {
      display: none;
    }
    .sidebar-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 999;
    }

    @media (max-width: 768px) {
      #sidebar {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        width: 84%;
        max-width: 320px;
        height: 100vh;
        transform: translateX(-100%);
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.6);
        z-index: 1000;
      }
      #sidebar.open {
        transform: translateX(0);
      }
      .sidebar-backdrop.active {
        display: block;
      }
      .mobile-menu-btn {
        display: flex !important;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: #0b1d44;
        border: 1px solid #1c3a73;
        color: #d4af37;
        font-size: 18px;
        cursor: pointer;
        flex-shrink: 0;
      }
      #top-header {
        padding: 0 12px;
        height: 56px;
      }
      .header-left {
        gap: 8px !important;
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .header-right-meta {
        display: none !important;
      }
      .bubble {
        max-width: 94% !important;
        padding: 12px 14px !important;
      }
      #input-dock {
        padding: 10px 12px 14px 12px;
      }
      .modal-box {
        width: 96% !important;
        max-height: 90vh !important;
      }
    }
  </style>
</head>
<body>
  <div id="sidebar-backdrop" class="sidebar-backdrop"></div>
  <div id="sidebar">
    <div class="brand-title">
      VCS Sovereign
      <span class="brand-pill">1M SOVEREIGN</span>
    </div>

    <button class="btn-new-session" id="new-session-btn">
      + New Session
    </button>

    <div>
      <div class="section-label">Selected Model (Copilot Routing)</div>
      <select id="model-select" class="model-select">
        <option value="auto" selected>⚡ Auto: Copilot Model Routing (Recommended)</option>
        <option value="llama3.2:3b">⚡ llama3.2:3b (Ultra-Fast 2s Engine)</option>
        <option value="qwen2.5-coder:7b">🛠️ qwen2.5-coder:7b (Coding Specialist)</option>
        <option value="deepseek-r1:8b">🔬 deepseek-r1:8b (Algorithmic CoT)</option>
        <option value="gemma4:e4b">🧠 gemma4:e4b (Heavy Deep Reasoning)</option>
        <option value="qwen2.5:14b">🏋️ qwen2.5:14b (Advanced Heavyweight)</option>
      </select>
    </div>

    <div>
      <div class="section-label">Web Research Preference</div>
      <select id="web-pref-select" class="model-select">
        <option value="auto" selected>Auto-Detect (Smart Research & URLs)</option>
        <option value="force">Force Live Web Search</option>
        <option value="disabled">Offline / Local Reasoning Only</option>
      </select>
    </div>

    <div class="context-meter-box">
      <div class="meter-header">
        <span class="meter-label">Context Headroom</span>
        <span class="meter-val" id="token-count">0 / 1,000,000</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="budget-fill"></div>
      </div>
    </div>

    <!-- 🔊 Voice Assistant Card -->
    <div class="bento-card" style="border-left: 3px solid var(--accent); background: linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(11,29,68,0.95) 100%);">
      <div class="bento-card-title">
        <span style="display:flex;align-items:center;gap:6px;">🔊 Voice Assistant</span>
        <span class="bento-badge" id="voice-status-badge">Active</span>
      </div>
      <label style="font-size:12px;display:flex;align-items:center;gap:8px;cursor:pointer;color:#e2e8f0;margin-top:2px;user-select:none;">
        <input type="checkbox" id="voice-enabled-toggle" style="accent-color:var(--accent);width:15px;height:15px;cursor:pointer;" checked />
        <span style="font-weight:600;">Read responses aloud</span>
      </label>
      <div style="margin-top:6px;">
        <select id="voice-select" class="model-select" style="padding:6px 10px;font-size:11.5px;background:#000000;">
          <option value="">Loading system voices...</option>
        </select>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-muted);margin-top:4px;">
        <span id="voice-streaming-indicator">⚡ Streaming Speech: On</span>
        <span style="color:var(--accent);font-family:'JetBrains Mono',monospace;">Ctrl+M</span>
      </div>
    </div>

    <!-- 🌐 Live Web Research Feed -->
    <div class="bento-card" style="background:#06163a;">
      <div class="bento-card-title">
        <span style="display:flex;align-items:center;gap:6px;">🌐 Live Research Feed</span>
        <span class="bento-badge" id="web-feed-badge" style="color:#e8c766;border-color:rgba(232,199,102,0.3);">Idle</span>
      </div>
      <div id="web-activity-log" style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#cbd5e1;display:flex;flex-direction:column;gap:5px;max-height:100px;overflow-y:auto;padding-top:4px;">
        <div style="color:var(--text-muted);font-style:italic;">No search executed yet.</div>
      </div>
    </div>

    <div class="section-label" style="margin-top: 8px;">Unified Tool Capsules</div>
    <div class="tool-bento">
      <div class="bento-card">
        <div class="bento-card-title">
          <span>Google Antigravity & IDE</span>
          <span class="bento-badge">Active</span>
        </div>
        <div class="bento-tools">
          <span class="tool-tag">read_file</span>
          <span class="tool-tag">edit_file</span>
          <span class="tool-tag">write_file</span>
          <span class="tool-tag">run_command</span>
        </div>
      </div>

      <div class="bento-card">
        <div class="bento-card-title">
          <span>Claude Code Engine</span>
          <span class="bento-badge">Active</span>
        </div>
        <div class="bento-tools">
          <span class="tool-tag">View</span>
          <span class="tool-tag">Edit</span>
          <span class="tool-tag">Replace</span>
          <span class="tool-tag">Grep</span>
        </div>
      </div>

      <div class="bento-card">
        <div class="bento-card-title">
          <span>Copilot & Manus Suite</span>
          <span class="bento-badge">Active</span>
        </div>
        <div class="bento-tools">
          <span class="tool-tag">web_search</span>
          <span class="tool-tag">web_fetch</span>
          <span class="tool-tag">youtube_transcript</span>
          <span class="tool-tag">workspace_diag</span>
        </div>
      </div>

      <div class="bento-card">
        <div class="bento-card-title">
          <span>🧠 Memoria & ClawHub Layer</span>
          <span class="bento-badge">Active</span>
        </div>
        <div class="bento-tools">
          <span class="tool-tag">memory_save</span>
          <span class="tool-tag">memory_recall</span>
          <span class="tool-tag">memory_view</span>
        </div>
      </div>

      <div class="bento-card">
        <div class="bento-card-title">
          <span>🧬 Autonomous Self-Evolution</span>
          <span class="bento-badge" id="bento-evo-badge">Active</span>
        </div>
        <div class="bento-tools">
          <span class="tool-tag">system_evolve</span>
          <span class="tool-tag">evolution_status</span>
        </div>
      </div>

      <div class="bento-card">
        <div class="bento-card-title">
          <span>🐇 CodeRabbit Suite</span>
          <span class="bento-badge">Active</span>
        </div>
        <div class="bento-tools">
          <span class="tool-tag">coderabbit_review</span>
          <span class="tool-tag">cr_prompt_only</span>
          <span class="tool-tag">cr_plain</span>
        </div>
      </div>
    </div>
  </div>

  <div id="main-chat">
    <div id="top-header">
      <div class="header-left" style="display:flex;align-items:center;gap:10px;">
        <button id="mobile-menu-btn" class="mobile-menu-btn" aria-label="Toggle Navigation">☰</button>
        <div class="engine-status-pill" id="net-status-pill">
          <div class="pulse-dot" id="net-pulse-dot"></div>
          <span id="net-status-text">Checking Live Connection...</span>
        </div>
        <button id="memory-modal-open-btn" style="background:#0b1d44;border:1px solid #1c3a73;color:#d4af37;border-radius:20px;padding:5px 13px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;">
          🧠 Memory Vault
        </button>
        <button id="evolution-modal-open-btn" style="background:#0b1d44;border:1px solid #d4af37;color:#d4af37;border-radius:20px;padding:5px 13px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;">
          🧬 <span id="evo-btn-label">Gen v2.1.0 • 98.4% Fitness</span>
        </button>
        <button id="voice-quick-toggle-btn" style="background:#0b1d44;border:1px solid #1c3a73;color:#d4af37;border-radius:20px;padding:5px 13px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s;">
          🔊 <span id="voice-quick-label">Voice: On</span>
        </button>
      </div>
      <div class="header-right-meta" style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #8292a6;">
        PORT 3090 • COPILOT AUTO-ROUTING • SELF-EVOLUTION ACTIVE
      </div>
    </div>

    <div id="chat-box">
      <div class="message-row assistant-row">
        <div class="bubble assistant-bubble">
          <div class="badge-bar">
            <div class="source-mode-pill pill-copilot-route">🎯 Copilot Auto-Routing Active</div>
            <div class="source-mode-pill pill-local-only">🧠 1M Context Sovereign</div>
          </div>
          <p>Welcome! VCS Sovereign features <b>GitHub Copilot Intelligent Local Model Routing</b> and <b>Live Web Research</b>.</p>
          <p style="margin-top: 8px; color: #94a3b8; font-size: 13px;">
            <b>Intelligent Routing:</b> Simple queries & explanations route to fast compute (1-2s response), coding to Qwen Coder, deep proofs to DeepSeek R1, and web URLs to the Live Research Router with word-by-word streaming!
          </p>
        </div>
      </div>
    </div>

    <div id="input-dock">
      <div class="input-wrapper">
        <textarea
          id="prompt-input"
          placeholder="Paste a YouTube/web URL, ask a question, request code, or operate on workspace files..."
          rows="2"
        ></textarea>
        <div class="dock-controls">
          <div class="input-meta-text">
            <span><b>Enter</b> = Send</span>
            <span>•</span>
            <span><b>Shift + Enter</b> = New line</span>
          </div>
          <button class="btn-send" id="send-btn">
            Send Prompt ↵
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Persistent Memory Vault Modal (ClawHub MEMORIA) -->
  <div id="memory-modal-overlay">
    <div id="memory-modal">
      <div class="modal-header">
        <div class="modal-title">🧠 Agent Persistent Memory Vault (ClawHub MEMORIA)</div>
        <button id="memory-modal-close-btn" style="background:transparent;border:none;color:#8292a6;font-size:18px;cursor:pointer;line-height:1;">✕</button>
      </div>
      <div class="modal-tabs">
        <button class="modal-tab-btn active" data-file="MEMORY.md">MEMORY.md</button>
        <button class="modal-tab-btn" data-file="DECISIONS.md">DECISIONS.md</button>
        <button class="modal-tab-btn" data-file="LESSONS.md">LESSONS.md</button>
        <button class="modal-tab-btn" data-file="USER.md">USER.md</button>
      </div>
      <div class="modal-body">
        <textarea id="memory-modal-text" class="memory-textarea" placeholder="Loading memory..."></textarea>
      </div>
      <div class="modal-footer">
        <span id="memory-modal-status" style="font-size:11px;color:#8292a6;font-family:'JetBrains Mono',monospace;">Zero Cloud • Persisted locally in /memory</span>
        <button id="memory-modal-save-btn" class="btn-send" style="padding:7px 16px;font-size:12px;">💾 Save Memory Changes</button>
      </div>
    </div>
  </div>

  <!-- Persistent Self-Evolution Modal (ClawHub self-evolution v2.0) -->
  <div id="evolution-modal-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);z-index:1000;align-items:center;justify-content:center;">
    <div id="evolution-modal" style="width:800px;max-width:92vw;height:620px;max-height:86vh;background:var(--panel);border:1px solid var(--accent);border-radius:var(--radius);box-shadow:0 10px 40px rgba(0,0,0,0.8),0 0 25px var(--accent-glow);display:flex;flex-direction:column;overflow:hidden;">
      <div class="modal-header">
        <div class="modal-title">🧬 Autonomous Self-Evolution Engine (ClawHub self-evolution v2.0)</div>
        <button id="evolution-modal-close-btn" style="background:transparent;border:none;color:#8292a6;font-size:18px;cursor:pointer;line-height:1;">✕</button>
      </div>
      <div style="background:#050f2b;border-bottom:1px solid var(--border);padding:14px 20px;display:flex;gap:16px;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:11px;color:#8292a6;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Current Lineage</div>
          <div style="font-size:16px;font-weight:800;color:#d4af37;" id="evo-modal-gen">Generation v2.1.0</div>
        </div>
        <div>
          <div style="font-size:11px;color:#8292a6;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Global Fitness</div>
          <div style="font-size:16px;font-weight:800;color:#e8c766;" id="evo-modal-fitness">98.4%</div>
        </div>
        <button id="trigger-evolution-btn" class="btn-send" style="padding:6px 14px;font-size:12px;">
          ⚡ Advance Evolution Cycle
        </button>
      </div>
      <div class="modal-body" style="padding:14px 20px;gap:10px;">
        <div style="font-size:12px;color:#8292a6;font-weight:600;">Autonomous Evolution Ledger (EVOLUTION.md):</div>
        <textarea id="evolution-ledger-text" class="memory-textarea" readonly style="font-size:11.5px;line-height:1.45;"></textarea>
      </div>
      <div class="modal-footer">
        <span id="evo-status-note" style="font-size:11px;color:#8292a6;font-family:'JetBrains Mono',monospace;">Zero Catastrophic Forgetting • Research-Backed Meta-Learning</span>
        <button id="refresh-evolution-btn" style="background:#0b1d44;border:1px solid #1c3a73;color:#d4af37;border-radius:6px;padding:6px 12px;font-size:11px;cursor:pointer;">↻ Refresh</button>
      </div>
    </div>
  </div>

  <script>
    let currentSessionId = 'session-' + Date.now();
    let currentTokens = 0;

    const chatBox = document.getElementById('chat-box');
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const modelSelect = document.getElementById('model-select');
    const webPrefSelect = document.getElementById('web-pref-select');
    const tokenCount = document.getElementById('token-count');
    const budgetFill = document.getElementById('budget-fill');
    const netStatusText = document.getElementById('net-status-text');
    const netPulseDot = document.getElementById('net-pulse-dot');
    const netStatusPill = document.getElementById('net-status-pill');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    if (mobileMenuBtn && sidebar && sidebarBackdrop) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarBackdrop.classList.toggle('active');
      });
      sidebarBackdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('active');
      });
    }

    // Dynamically discover installed Ollama models (Copilot feature)
    async function loadDiscoveredModels() {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            const currentSelected = modelSelect.value;
            const existingOptions = new Set(Array.from(modelSelect.options).map(o => o.value));
            
            const group = document.createElement('optgroup');
            group.label = '⚡ Discovered Local Models (' + data.models.length + ')';
            
            data.models.forEach(m => {
              const modelId = typeof m === 'object' ? (m.id || m.name) : m;
              const modelLabel = typeof m === 'object' ? (m.id + (m.size ? ' [' + m.size + ']' : '')) : m;
              if (modelId && !existingOptions.has(modelId)) {
                existingOptions.add(modelId);
                const opt = document.createElement('option');
                opt.value = modelId;
                opt.textContent = '🤖 ' + modelLabel;
                group.appendChild(opt);
              }
            });
            if (group.children.length > 0) {
              modelSelect.appendChild(group);
            }
          }
        }
      } catch (e) {
        console.warn('Could not load discovered models:', e);
      }
    }
    loadDiscoveredModels();

    async function pollNetworkStatus() {
      try {
        const res = await fetch('/api/network-status');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.online) {
          netStatusText.innerText = '🌐 Internet Confirmed (DuckDuckGo & URL Research Active)';
          netPulseDot.className = 'pulse-dot';
          netStatusPill.style.borderColor = 'rgba(212,175,55, 0.4)';
          netStatusPill.style.color = '#d4af37';
        } else {
          netStatusText.innerText = '○ Offline Mode (Local Knowledge Only)';
          netPulseDot.className = 'pulse-dot offline';
          netStatusPill.style.borderColor = '#334155';
          netStatusPill.style.color = '#94a3b8';
        }
      } catch (e) {
        netStatusText.innerText = '○ Offline (Server Heartbeat Unavailable)';
        netPulseDot.className = 'pulse-dot offline';
      }
    }
    pollNetworkStatus();
    setInterval(pollNetworkStatus, 5000);

    // ==========================================
    // 🔊 Voice Engine (SpeechSynthesis Read Aloud)
    // ==========================================
    let speechBuffer = '';
    const voiceEnabledToggle = document.getElementById('voice-enabled-toggle');
    const voiceSelect = document.getElementById('voice-select');
    const voiceQuickToggleBtn = document.getElementById('voice-quick-toggle-btn');
    const voiceQuickLabel = document.getElementById('voice-quick-label');
    const voiceStatusBadge = document.getElementById('voice-status-badge');
    const voiceStreamingIndicator = document.getElementById('voice-streaming-indicator');

    function isVoiceEnabled() {
      return voiceEnabledToggle ? voiceEnabledToggle.checked : true;
    }

    function setVoiceEnabled(enabled) {
      if (voiceEnabledToggle) voiceEnabledToggle.checked = enabled;
      if (voiceQuickLabel) voiceQuickLabel.innerText = enabled ? 'Voice: On' : 'Voice: Muted';
      if (voiceStatusBadge) voiceStatusBadge.innerText = enabled ? 'Active' : 'Muted';
      if (voiceStreamingIndicator) voiceStreamingIndicator.innerText = enabled ? '⚡ Streaming Speech: On' : '○ Speech: Muted';
      if (!enabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }

    if (voiceEnabledToggle) {
      voiceEnabledToggle.addEventListener('change', () => {
        setVoiceEnabled(voiceEnabledToggle.checked);
      });
    }

    if (voiceQuickToggleBtn) {
      voiceQuickToggleBtn.addEventListener('click', () => {
        setVoiceEnabled(!isVoiceEnabled());
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setVoiceEnabled(!isVoiceEnabled());
      }
    });

    const googleAIStudioProfiles = {
      "google-studio-puck": {
        label: "🌟 [Google AI Studio] Puck (Playful & Crisp)",
        pitch: 1.12,
        rate: 1.05,
        matchPrefs: ["Google US English", "Google", "Microsoft Christopher", "Microsoft Guy", "en-US"]
      },
      "google-studio-charon": {
        label: "🌟 [Google AI Studio] Charon (Deep & Authoritative)",
        pitch: 0.82,
        rate: 0.96,
        matchPrefs: ["Google UK English Male", "Google", "Microsoft David", "Microsoft Guy", "en-US"]
      },
      "google-studio-kore": {
        label: "🌟 [Google AI Studio] Kore (Calm & Soothing)",
        pitch: 1.00,
        rate: 0.98,
        matchPrefs: ["Google US English", "Google UK English Female", "Google", "Microsoft Jenny", "Microsoft Aria", "en-US"]
      },
      "google-studio-fenrir": {
        label: "🌟 [Google AI Studio] Fenrir (Direct & Confident)",
        pitch: 0.92,
        rate: 1.08,
        matchPrefs: ["Google US English", "Google", "Microsoft Christopher", "Microsoft Guy", "en-US"]
      },
      "google-studio-aoede": {
        label: "🌟 [Google AI Studio] Aoede (Warm & Expressive)",
        pitch: 1.06,
        rate: 1.02,
        matchPrefs: ["Google UK English Female", "Google US English", "Google", "Microsoft Aria", "Microsoft Jenny", "en-US"]
      }
    };

    const preferredVoices = [
      "Google US English",
      "Google UK English Female",
      "Google UK English Male",
      "Google",
      "Microsoft Aria Online (Natural)",
      "Microsoft Jenny Online (Natural)",
      "Microsoft Guy Online (Natural)",
      "Microsoft Christopher Online (Natural)",
      "Microsoft Ava Online (Natural)",
      "Microsoft Emma Online (Natural)",
      "Microsoft David Desktop",
      "Microsoft Zira Desktop"
    ];

    function cleanTextForSpeech(raw) {
      return (raw || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\\\`\\\`\\\`[\\s\\S]*?\\\`\\\`\\\`/g, ' code block omitted ')
        .replace(/\\\`[^\\\`]+\\\`/g, ' code ')
        .replace(/[*#_~>\\[\\]\\(\\)]/g, ' ')
        .replace(/https?:\\/\\/\\S+/g, 'link')
        .replace(/\\s+/g, ' ')
        .trim();
    }

    function speakText(text) {
      if (!isVoiceEnabled() || !window.speechSynthesis) return;

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned || cleaned.length < 2) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      const allVoices = speechSynthesis.getVoices();
      const selectedVoiceVal = voiceSelect ? voiceSelect.value : (localStorage.getItem('vcs_selected_voice') || '');

      let matchedVoice = null;
      let targetPitch = 1.0;
      let targetRate = 1.05;

      if (selectedVoiceVal && googleAIStudioProfiles[selectedVoiceVal]) {
        const profile = googleAIStudioProfiles[selectedVoiceVal];
        targetPitch = profile.pitch;
        targetRate = profile.rate;
        for (const pref of profile.matchPrefs) {
          const found = allVoices.find(v => v.name.includes(pref) || v.name === pref || (pref === 'en-US' && v.lang.startsWith('en')));
          if (found) {
            matchedVoice = found;
            break;
          }
        }
      } else if (selectedVoiceVal) {
        matchedVoice = allVoices.find(v => v.name === selectedVoiceVal);
      }

      if (!matchedVoice) {
        for (const pref of preferredVoices) {
          const found = allVoices.find(v => v.name.includes(pref) || v.name === pref);
          if (found) {
            matchedVoice = found;
            break;
          }
        }
      }
      if (!matchedVoice) {
        matchedVoice = allVoices.find(v => v.name.includes('Google')) ||
                       allVoices.find(v => v.name.includes('Microsoft')) ||
                       allVoices.find(v => v.lang.startsWith('en'));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      utterance.rate = targetRate;
      utterance.pitch = targetPitch;
      window.speechSynthesis.speak(utterance);
    }

    // Splits a streamed buffer into complete sentences (ending in . ! ? followed by whitespace)
    // and the unfinished tail that still needs more text.
    function takeCompleteSentences(buf) {
      const re = /[.!?]+["')\\]]*\\s+/g;
      const sentences = [];
      let last = 0;
      let m;
      while ((m = re.exec(buf)) !== null) {
        const end = m.index + m[0].length;
        sentences.push(buf.slice(last, end));
        last = end;
      }
      return { sentences: sentences, rest: buf.slice(last) };
    }

    function loadSystemVoices() {
      if (!window.speechSynthesis || !voiceSelect) return;
      const voices = speechSynthesis.getVoices();
      if (!voices || !voices.length) return;

      const savedPref = localStorage.getItem('vcs_selected_voice') || voiceSelect.value || 'google-studio-puck';
      voiceSelect.innerHTML = '';

      // 1. Google AI Studio Voice Personas
      const studioGroup = document.createElement('optgroup');
      studioGroup.label = '⚡ Google AI Studio Voices';
      Object.keys(googleAIStudioProfiles).forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = googleAIStudioProfiles[id].label;
        studioGroup.appendChild(opt);
      });
      voiceSelect.appendChild(studioGroup);

      // 2. Sort installed system voices: Google first, then Microsoft AI, then others
      const sortedVoices = [...voices].sort((a, b) => {
        const aIsGoogle = a.name.includes('Google');
        const bIsGoogle = b.name.includes('Google');
        if (aIsGoogle && !bIsGoogle) return -1;
        if (!aIsGoogle && bIsGoogle) return 1;

        const aIndex = preferredVoices.findIndex(p => a.name.includes(p) || a.name === p);
        const bIndex = preferredVoices.findIndex(p => b.name.includes(p) || b.name === p);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        const aIsMs = a.name.includes('Microsoft');
        const bIsMs = b.name.includes('Microsoft');
        if (aIsMs && !bIsMs) return -1;
        if (!aIsMs && bIsMs) return 1;

        return a.name.localeCompare(b.name);
      });

      // 3. Browser & System AI Voices Group
      const sysGroup = document.createElement('optgroup');
      sysGroup.label = '🎙️ Browser & System AI Voices';
      sortedVoices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.name;
        let prefix = '';
        if (v.name.includes('Google')) {
          prefix = '🌟 [Google AI] ';
        } else if (v.name.includes('Microsoft') && (v.name.includes('Natural') || v.name.includes('Online'))) {
          prefix = '✨ [Microsoft AI] ';
        } else if (v.name.includes('Microsoft')) {
          prefix = '🔹 [Microsoft] ';
        }
        opt.textContent = prefix + v.name + ' (' + v.lang + ')';
        sysGroup.appendChild(opt);
      });
      voiceSelect.appendChild(sysGroup);

      if (savedPref && (googleAIStudioProfiles[savedPref] || voices.some(v => v.name === savedPref))) {
        voiceSelect.value = savedPref;
      } else {
        voiceSelect.value = 'google-studio-puck';
      }
    }

    if (voiceSelect) {
      voiceSelect.addEventListener('change', () => {
        if (voiceSelect.value) {
          localStorage.setItem('vcs_selected_voice', voiceSelect.value);
        }
      });
    }

    if (window.speechSynthesis) {
      speechSynthesis.onvoiceschanged = loadSystemVoices;
      loadSystemVoices();
    }

    // ==========================================
    // 🌐 Live Research Activity Logger
    // ==========================================
    function logResearchActivity(name, query) {
      const log = document.getElementById('web-activity-log');
      const badge = document.getElementById('web-feed-badge');
      if (badge) {
        badge.innerText = 'Searching';
        badge.style.color = '#d4af37';
      }
      if (log) {
        if (log.innerHTML.includes('No search executed')) log.innerHTML = '';
        const item = document.createElement('div');
        item.style.padding = '4px 8px';
        item.style.background = 'rgba(212,175,55, 0.08)';
        item.style.borderLeft = '2px solid var(--accent)';
        item.style.borderRadius = '3px';
        item.style.fontSize = '11px';
        item.innerHTML = '🌐 <b>' + escapeHtml(name) + '</b><br/><span style="color:#94a3b8">' + escapeHtml(query || '') + '</span>';
        log.appendChild(item);
        log.scrollTop = log.scrollHeight;
      }
    }

    document.getElementById('new-session-btn').addEventListener('click', () => {
      currentSessionId = 'session-' + Date.now();
      chatBox.innerHTML = '';
      currentTokens = 0;
      tokenCount.innerText = '0 / 1,000,000';
      budgetFill.style.width = '0.1%';
      const row = document.createElement('div');
      row.className = 'message-row assistant-row';
      row.innerHTML = '<div class="bubble assistant-bubble"><div class="badge-bar"><div class="source-mode-pill pill-local-only">🧠 New Session Initialized</div></div><p>Session reset. Context headroom: 1,000,000 tokens.</p></div>';
      chatBox.appendChild(row);
    });

    // Enter = Send, Shift + Enter = New line
    promptInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        dispatchUserMessage();
      }
    });

    sendBtn.addEventListener('click', function(e) {
      e.preventDefault();
      dispatchUserMessage();
    });

    function escapeHtml(str) {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderFormattedContent(rawText) {
      const escaped = escapeHtml(rawText);
      const codeBlockFormatted = escaped.replace(/\\\`\\\`\\\`([\\s\\S]*?)\\\`\\\`\\\`/g, (m, code) => {
        return '<pre class="code-block"><code>' + code + '</code></pre>';
      });
      const inlineCodeFormatted = codeBlockFormatted.replace(/\\\`([^\\\`]+)\\\`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 5px;border-radius:4px;font-family:monospace;">$1</code>');
      const boldFormatted = inlineCodeFormatted.replace(/\\*\\*(.*?)\\*\\*/g, '<b>$1</b>');
      return boldFormatted.replace(/\\n/g, '<br/>');
    }

    async function dispatchUserMessage() {
      const text = promptInput.value.trim();
      if (!text) return;

      // Stop any previous speech synthesis immediately
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      speechBuffer = '';

      promptInput.value = '';

      // User Bubble
      const userRow = document.createElement('div');
      userRow.className = 'message-row user-row';
      userRow.innerHTML = '<div class="bubble user-bubble">' + escapeHtml(text).replace(/\\n/g, '<br/>') + '</div>';
      chatBox.appendChild(userRow);

      // Assistant Bubble with Live Progress Line
      const asstRow = document.createElement('div');
      asstRow.className = 'message-row assistant-row';
      const asstDiv = document.createElement('div');
      asstDiv.className = 'bubble assistant-bubble';
      asstDiv.innerHTML = '<div class="live-status-line">⚡ Routing Inquiry via Copilot Dispatcher...</div>' +
        '<div class="reply-container" style="color:#8292a6">Analyzing prompt...</div>';
      asstRow.appendChild(asstDiv);
      chatBox.appendChild(asstRow);
      chatBox.scrollTop = chatBox.scrollHeight;

      const liveLine = asstDiv.querySelector('.live-status-line');
      const replyContainer = asstDiv.querySelector('.reply-container');

      const model = modelSelect.value;
      const webPreference = webPrefSelect.value;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            message: text,
            model,
            webPreference,
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error('Server returned HTTP ' + response.status);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedReply = '';
        let metadata = null;
        let routingInfo = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === 'routing') {
                  routingInfo = event;
                  liveLine.innerText = event.text;
                } else if (event.type === 'tool') {
                  logResearchActivity(event.name, event.query || event.text);
                } else if (event.type === 'announcement') {
                  speakText(event.text);
                } else if (event.type === 'status') {
                  liveLine.innerText = event.text;
                } else if (event.type === 'chunk') {
                  accumulatedReply += event.text;
                  replyContainer.style.color = '#e2e8f0';
                  replyContainer.innerHTML = renderFormattedContent(accumulatedReply);
                  chatBox.scrollTop = chatBox.scrollHeight;

                  // Streaming Speech Synthesis (Speaks completed sentences in real-time)
                  speechBuffer += event.text;
                  const split = takeCompleteSentences(speechBuffer);
                  let carry = '';
                  for (const s of split.sentences) {
                    carry += s;
                    if (carry.trim().length > 15) {
                      speakText(carry);
                      carry = '';
                    }
                  }
                  speechBuffer = carry + split.rest;
                } else if (event.type === 'done') {
                  metadata = event;
                  if (speechBuffer.trim()) {
                    speakText(speechBuffer);
                    speechBuffer = '';
                  }
                  const badge = document.getElementById('web-feed-badge');
                  if (badge) {
                    badge.innerText = (metadata?.online ? 'Online' : 'Idle');
                    badge.style.color = metadata?.online ? '#e8c766' : '#94a3b8';
                  }
                }
              } catch (e) {}
            }
          }
        }

        // Build Badge Bar (Grounding Mode + Copilot Routing)
        let badgesHtml = '<div class="badge-bar">';

        if (routingInfo) {
          badgesHtml += '<div class="source-mode-pill pill-copilot-route">🎯 ' + escapeHtml(routingInfo.model) + ' (' + escapeHtml(routingInfo.taskType) + ')</div>';
        }

        const sourceMode = metadata?.sourceMode || 'LOCAL_ONLY';
        const statusLabel = metadata?.statusLabel || (sourceMode === 'WEB_VERIFIED' ? 'LIVE SOURCES RETRIEVED' : 'LOCAL REASONING');
        if (sourceMode === 'WEB_VERIFIED') {
          badgesHtml += '<div class="source-mode-pill pill-web-verified">🌐 ' + escapeHtml(statusLabel) + ' (' + (metadata?.evidence?.length || 1) + ' Sources)</div>';
        } else if (sourceMode === 'SEARCH_FAILED_FALLBACK') {
          badgesHtml += '<div class="source-mode-pill pill-web-partial">⚠️ ' + escapeHtml(statusLabel) + '</div>';
        } else if (sourceMode === 'DOCUMENT_ANALYSIS') {
          badgesHtml += '<div class="source-mode-pill pill-doc-analysis">📄 ' + escapeHtml(statusLabel) + '</div>';
        } else if (sourceMode === 'MODEL_UNAVAILABLE') {
          badgesHtml += '<div class="source-mode-pill pill-model-unavailable">⚠️ Model Unavailable</div>';
        } else {
          badgesHtml += '<div class="source-mode-pill pill-local-only">🧠 ' + escapeHtml(statusLabel) + '</div>';
        }

        badgesHtml += '</div>';

        // Build Evidence Accordion
        let evidenceHtml = '';
        if (metadata?.evidence && metadata.evidence.length > 0) {
          const details = metadata.evidence.map(e =>
            '• <b>' + escapeHtml(e.title || e.source) + '</b><br/>' +
            (e.url ? '<a href="' + escapeHtml(e.url) + '" target="_blank" style="color:#d4af37;font-size:11px;">' + escapeHtml(e.url) + '</a><br/>' : '') +
            escapeHtml(e.snippet)
          ).join('<br/><br/>');

          evidenceHtml = '<details class="evidence-accordion">' +
            '<summary class="evidence-summary">🔍 Inspect ' + metadata.evidence.length + ' Verified Web Evidence Source(s)</summary>' +
            '<div class="evidence-content">' + details + '</div>' +
            '</details>';
        }

        // Build Tools Executed Capsules
        let toolsHtml = '';
        if (metadata?.toolsExecuted && metadata.toolsExecuted.length > 0) {
          metadata.toolsExecuted.forEach(t => {
            const toolName = t.name || 'Tool';
            const toolResult = t.result !== undefined ? t.result : t;
            toolsHtml += '<div class="tool-capsule">⚡ <b>' + escapeHtml(toolName) + '</b>: ' +
              escapeHtml(JSON.stringify(toolResult).slice(0, 250)) + '</div>';
          });
        }

        asstDiv.innerHTML = badgesHtml +
          '<div>' + renderFormattedContent(accumulatedReply || 'Task completed.') + '</div>' +
          toolsHtml +
          evidenceHtml;

        if (metadata?.tokens) {
          currentTokens = metadata.tokens;
          tokenCount.innerText = currentTokens + ' / 1,000,000';
          const pct = Math.min(100, (currentTokens / 1000000) * 100);
          budgetFill.style.width = pct + '%';
        }
      } catch (err) {
        console.error('Chat error:', err);
        asstDiv.innerHTML = '<div class="badge-bar"><div class="source-mode-pill pill-model-unavailable">⚠️ Request Failed</div></div>' +
          '<b style="color:#ff6b6b">' + escapeHtml(err.message) + '</b>';
      }
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Memory Vault Modal Interaction (ClawHub MEMORIA)
    const memoryOverlay = document.getElementById('memory-modal-overlay');
    const memoryOpenBtn = document.getElementById('memory-modal-open-btn');
    const memoryCloseBtn = document.getElementById('memory-modal-close-btn');
    const memoryText = document.getElementById('memory-modal-text');
    const memorySaveBtn = document.getElementById('memory-modal-save-btn');
    const memoryStatus = document.getElementById('memory-modal-status');
    const memoryTabBtns = document.querySelectorAll('.modal-tab-btn');

    let activeMemoryFile = 'MEMORY.md';
    let cachedMemory = {};

    async function loadMemoryVault() {
      try {
        memoryStatus.innerText = 'Loading memory files...';
        const res = await fetch('/api/memory');
        if (res.ok) {
          const data = await res.json();
          cachedMemory = data.files || {};
          memoryText.value = cachedMemory[activeMemoryFile] || '';
          memoryStatus.innerText = '● Memory Loaded from: ' + data.memoryDir;
        }
      } catch (err) {
        memoryStatus.innerText = 'Failed to load memory: ' + err.message;
      }
    }

    if (memoryOpenBtn) {
      memoryOpenBtn.addEventListener('click', () => {
        memoryOverlay.style.display = 'flex';
        loadMemoryVault();
      });
    }

    if (memoryCloseBtn) {
      memoryCloseBtn.addEventListener('click', () => {
        memoryOverlay.style.display = 'none';
      });
    }

    memoryTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        memoryTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeMemoryFile = btn.getAttribute('data-file');
        memoryText.value = cachedMemory[activeMemoryFile] || '';
      });
    });

    if (memorySaveBtn) {
      memorySaveBtn.addEventListener('click', async () => {
        try {
          memoryStatus.innerText = 'Saving changes to ' + activeMemoryFile + '...';
          const res = await fetch('/api/memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: activeMemoryFile,
              content: memoryText.value
            })
          });
          if (res.ok) {
            cachedMemory[activeMemoryFile] = memoryText.value;
            memoryStatus.innerText = '✅ Successfully saved ' + activeMemoryFile + ' to persistent memory!';
          } else {
            memoryStatus.innerText = '⚠️ Save failed: HTTP ' + res.status;
          }
        } catch (err) {
          memoryStatus.innerText = '⚠️ Error: ' + err.message;
        }
      });
    }

    // Self-Evolution Modal Interaction (ClawHub self-evolution v2.0)
    const evoOverlay = document.getElementById('evolution-modal-overlay');
    const evoOpenBtn = document.getElementById('evolution-modal-open-btn');
    const evoCloseBtn = document.getElementById('evolution-modal-close-btn');
    const evoGenLabel = document.getElementById('evo-btn-label');
    const evoModalGen = document.getElementById('evo-modal-gen');
    const evoModalFitness = document.getElementById('evo-modal-fitness');
    const evoLedgerText = document.getElementById('evolution-ledger-text');
    const evoStatusNote = document.getElementById('evo-status-note');
    const triggerEvoBtn = document.getElementById('trigger-evolution-btn');
    const refreshEvoBtn = document.getElementById('refresh-evolution-btn');
    const bentoEvoBadge = document.getElementById('bento-evo-badge');

    async function loadEvolutionData() {
      try {
        const res = await fetch('/api/evolution');
        if (res.ok) {
          const data = await res.json();
          const st = data.state || {};
          if (evoGenLabel) evoGenLabel.innerText = 'Gen ' + (st.generation || 'v2.1.0') + ' • ' + (st.fitnessScore || 98.4) + '% Fitness';
          if (evoModalGen) evoModalGen.innerText = 'Generation ' + (st.generation || 'v2.1.0');
          if (evoModalFitness) evoModalFitness.innerText = (st.fitnessScore || 98.4) + '%';
          if (evoLedgerText) evoLedgerText.value = data.ledger || '';
          if (bentoEvoBadge) bentoEvoBadge.innerText = (st.generation || 'v2.1.0') + ' Active';
        }
      } catch (err) {}
    }
    loadEvolutionData();

    if (evoOpenBtn) {
      evoOpenBtn.addEventListener('click', () => {
        evoOverlay.style.display = 'flex';
        loadEvolutionData();
      });
    }

    if (evoCloseBtn) {
      evoCloseBtn.addEventListener('click', () => {
        evoOverlay.style.display = 'none';
      });
    }

    if (refreshEvoBtn) {
      refreshEvoBtn.addEventListener('click', loadEvolutionData);
    }

    if (triggerEvoBtn) {
      triggerEvoBtn.addEventListener('click', async () => {
        try {
          evoStatusNote.innerText = 'Running Autonomous Evolution Cycle...';
          const res = await fetch('/api/evolution', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ focus: 'Autonomous User Trigger', notes: 'Triggered from web dashboard' })
          });
          if (res.ok) {
            const data = await res.json();
            evoStatusNote.innerText = '✅ Advanced to ' + data.generation + ' (' + data.fitnessScore + '% Fitness)';
            loadEvolutionData();
          } else {
            evoStatusNote.innerText = '⚠️ Evolution error: HTTP ' + res.status;
          }
        } catch (e) {
          evoStatusNote.innerText = '⚠️ Evolution failed: ' + e.message;
        }
      });
    }
  </script>
</body>
</html>`);
  });

  // Network-Aware Chat API (Supports Server-Sent Events / SSE Streaming & Direct JSON)
  app.post('/api/chat', async (req, res) => {
    const { sessionId, message, model, webPreference = 'auto', stream = false } = req.body;
    const wantsStream = stream || (req.headers.accept && req.headers.accept.includes('text/event-stream'));

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }
    const history = sessions.get(sessionId);

    // If client requested streaming:
    if (wantsStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const result = await router.routeAndAnswer({
          sessionId,
          message,
          model: model || 'auto',
          webPreference,
          history,
          onProgress: (p) => {
            sendEvent(p);
          }
        });

        history.push({ role: 'user', content: message });
        history.push({ role: 'assistant', content: result.reply });

        sendEvent({
          type: 'done',
          reply: result.reply,
          sourceMode: result.sourceMode,
          statusLabel: result.statusLabel,
          online: result.online,
          evidence: result.evidence || [],
          toolsExecuted: result.toolsExecuted || [],
          tokens: result.tokens,
          model: result.model,
          routingDecision: result.routingDecision
        });

        res.end();
      } catch (err) {
        console.error('[SBH Stream Error]', err);
        sendEvent({ type: 'status', text: `Error: ${err.message}` });
        sendEvent({ type: 'done', sourceMode: 'MODEL_UNAVAILABLE', error: err.message });
        res.end();
      }
      return;
    }

    // Direct JSON fallback
    try {
      const result = await router.routeAndAnswer({
        sessionId,
        message,
        model: model || 'auto',
        webPreference,
        history
      });

      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: result.reply });

      res.json({
        reply: result.reply,
        response: result.reply,
        content: result.reply,
        sourceMode: result.sourceMode,
        statusLabel: result.statusLabel,
        online: result.online,
        evidence: result.evidence || [],
        searchAttempted: result.searchAttempted,
        searchProvider: result.searchProvider,
        fallbackTriggered: result.fallbackTriggered,
        tokens: result.tokens,
        model: result.model,
        routingDecision: result.routingDecision
      });
    } catch (err) {
      console.error('[SBH] Chat error:', err);
      res.status(500).json({
        error: err.message,
        reply: `Server Error: ${err.message}`,
        sourceMode: 'MODEL_UNAVAILABLE'
      });
    }
  });

  return {
    start: () => {
      server.listen(port, () => {
        console.log(`\n======================================================`);
        console.log(`VCS Sovereign v1.0.0 Online`);
        console.log(`🚀 Web Dashboard: http://127.0.0.1:${port}`);
        console.log(`🎯 Copilot Intelligent Local Model Routing Armed`);
        console.log(`======================================================\n`);
      });
    }
  };
}
