import fs from 'fs';
import path from 'path';

/**
 * VCS Sovereign Persistent Memory Engine
 * Implements ClawHub's MEMORIA & Memory-Toolkit standards:
 * - Local zero-cloud markdown persistence
 * - Structured categories: User Profile, Stack, Decisions Log, Lessons Learned, Project Focus
 * - Automatic system-prompt injection
 * - Interactive UI memory drawer
 */
export class PersistentMemoryEngine {
  constructor(memoryDir = 'C:\\Users\\vence\\.gemini\\antigravity\\scratch\\space-bunny-harness\\memory') {
    this.memoryDir = path.resolve(memoryDir);
    this.ensureStructure();
  }

  ensureStructure() {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }

    const defaultFiles = {
      'MEMORY.md': `# 🧠 VCS Sovereign — Persistent Intelligence Layer
Last updated: ${new Date().toISOString().split('T')[0]}

## WHO I AM
Owner: User
Role: Architect & Engineer
System: VCS Sovereign (1M Context Local Intelligence)

## WHAT WE ARE BUILDING
- VCS Sovereign: Autonomous multi-model local AI harness on port 3090 with Copilot routing, DuckDuckGo research, YouTube spoken-transcript extraction, and unified Antigravity/Claude Code tool engine.

## OUR TECH STACK
- Frontend: HTML5, CSS3 (Easter Egg Blue #78e0dc, Obsidian Black #05070a), SSE Streaming
- Backend: Node.js (Express, ES Modules), Python 3.14 (youtube_transcript_api)
- Local AI Engines: Ollama (llama3.2:3b, qwen2.5-coder:7b, deepseek-r1:8b, qwen2.5:14b)
- Tools: Google Antigravity & IDE, Claude Code, GitHub Copilot, OpenClaw ClawHub Skills

## SYSTEM ARCHITECTURAL RULES
1. Never guess or hallucinate YouTube video contents — always inspect title, channel, description, and full spoken transcript via youtube_transcript_api.
2. Fast conversational turns route to llama3.2:3b; coding and tool execution route to qwen2.5-coder:7b; algorithmic math routes to deepseek-r1:8b.
3. Enter sends prompt; Shift+Enter creates newlines.
4. Grounding modes: WEB_VERIFIED, WEB_PARTIAL, LOCAL_ONLY, MODEL_UNAVAILABLE.
`,
      'DECISIONS.md': `# 📋 Architectural Decisions Log

### ${new Date().toISOString().split('T')[0]} — Copilot Local Model Routing
- Decision: Route prompts by task classification (3B for chat, 7B Coder for tools/code, 8B R1 for proofs).
- Reason: Avoids heavy 10GB CPU freezes and gives 1–2s sub-second responses.
- Alternatives rejected: Monolithic heavy model for all tasks.

### ${new Date().toISOString().split('T')[0]} — Server-Sent Events (SSE) Streaming
- Decision: Implement true text/event-stream with immediate routing, status, and chunk emissions.
- Reason: Eliminates UI freezing and gives instant time-to-first-token.

### ${new Date().toISOString().split('T')[0]} — Direct YouTube Transcript Extraction
- Decision: Use youtube_transcript_api in Python to pull full word-for-word spoken transcript.
- Reason: Raw HTML scraping on YouTube returns empty noscript tags without video transcript or full description.
`,
      'LESSONS.md': `# 💡 Lessons Learned & Operational Gotchas

- [YouTube TimedText]: YouTube requires signed player responses or youtube_transcript_api client emulation to retrieve captions.
- [CPU Context Window]: Feeding >20,000 characters to a 3B model on CPU causes memory thrashing; keep evidence dense and high-signal (5,000–12,000 chars).
- [Multi-turn Anaphora]: When user asks "What are the important facts of this video", session history must preserve previous URL context so DuckDuckGo doesn't run literal keyword search.
`,
      'USER.md': `# 👤 User Profile & Preferences

- Interaction Preference: Concise, direct, high-density responses.
- Visual Theme: Easter Egg Blue (#78e0dc) & Obsidian Black (#05070a).
- Design Standard: 10k Agency Standards.
`
    };

    for (const [filename, content] of Object.entries(defaultFiles)) {
      const fullPath = path.join(this.memoryDir, filename);
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8');
      }
    }
  }

  /**
   * Load high-density memory summary for system prompt injection
   */
  loadActiveMemory() {
    try {
      const memPath = path.join(this.memoryDir, 'MEMORY.md');
      const decPath = path.join(this.memoryDir, 'DECISIONS.md');
      const usrPath = path.join(this.memoryDir, 'USER.md');
      const lesPath = path.join(this.memoryDir, 'LESSONS.md');

      let summary = '';
      if (fs.existsSync(memPath)) {
        summary += fs.readFileSync(memPath, 'utf-8') + '\n\n';
      }
      if (fs.existsSync(usrPath)) {
        summary += fs.readFileSync(usrPath, 'utf-8') + '\n\n';
      }
      if (fs.existsSync(decPath)) {
        const decContent = fs.readFileSync(decPath, 'utf-8');
        // Include latest decisions
        const recentDecisions = decContent.split('###').slice(-3).join('###');
        summary += '## RECENT ARCHITECTURAL DECISIONS\n###' + recentDecisions + '\n\n';
      }
      if (fs.existsSync(lesPath)) {
        const lesContent = fs.readFileSync(lesPath, 'utf-8');
        summary += '## KEY LESSONS & GOTCHAS\n' + lesContent.split('\n').filter(l => l.startsWith('-')).slice(-5).join('\n') + '\n';
      }

      return summary.trim();
    } catch (err) {
      console.warn('[Memory] Failed to load active memory:', err.message);
      return '';
    }
  }

  /**
   * Save a new memory entry
   */
  saveMemoryItem({ category = 'fact', text, context = '' }) {
    if (!text) return { success: false, error: 'No memory text provided' };

    const dateStr = new Date().toISOString().split('T')[0];
    const targetFile = category === 'decision' ? 'DECISIONS.md' :
                       category === 'lesson' ? 'LESSONS.md' :
                       category === 'preference' ? 'USER.md' : 'MEMORY.md';

    const fullPath = path.join(this.memoryDir, targetFile);
    let entry = '';

    if (category === 'decision') {
      entry = `\n### ${dateStr} — ${text}\n- Decision: ${text}\n${context ? `- Context: ${context}\n` : ''}- Confirmed in VCS Sovereign session.\n`;
    } else if (category === 'lesson') {
      entry = `\n- [${dateStr}]: ${text}${context ? ` (Context: ${context})` : ''}`;
    } else if (category === 'preference') {
      entry = `\n- [${dateStr} Preference]: ${text}${context ? ` (${context})` : ''}`;
    } else {
      entry = `\n- [${dateStr} Fact]: ${text}${context ? ` (${context})` : ''}`;
    }

    try {
      fs.appendFileSync(fullPath, entry, 'utf-8');
      return {
        success: true,
        category,
        file: targetFile,
        entry: entry.trim(),
        message: `Saved to ${targetFile} successfully`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Recall / search memory files for matching keywords
   */
  recallMemory(query = '') {
    if (!query) return { success: true, results: [] };
    const qLower = query.toLowerCase().trim();
    const results = [];

    const files = ['MEMORY.md', 'DECISIONS.md', 'LESSONS.md', 'USER.md'];
    for (const f of files) {
      const fullPath = path.join(this.memoryDir, f);
      if (!fs.existsSync(fullPath)) continue;

      const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes(qLower)) {
          // Grab context around match
          const snippetStart = Math.max(0, i - 1);
          const snippetEnd = Math.min(lines.length - 1, i + 2);
          const snippet = lines.slice(snippetStart, snippetEnd + 1).join('\n');
          results.push({
            file: f,
            line: i + 1,
            snippet: snippet.trim()
          });
          if (results.length >= 10) break;
        }
      }
    }

    return {
      success: true,
      query,
      matchCount: results.length,
      results
    };
  }

  /**
   * Return full contents of memory files for inspection
   */
  getAllMemory() {
    const memoryData = {};
    const files = ['MEMORY.md', 'DECISIONS.md', 'LESSONS.md', 'USER.md'];
    for (const f of files) {
      const p = path.join(this.memoryDir, f);
      memoryData[f] = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
    }
    return {
      memoryDir: this.memoryDir,
      files: memoryData
    };
  }
}
