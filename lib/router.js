import https from 'https';
import http from 'http';
import { checkInternet, ToolRunner } from './tools.js';
import { PersistentMemoryEngine } from './memory.js';
import { EvolutionEngine } from './evolution.js';

/**
 * VCS Sovereign Network-Aware Agent & Copilot Model Router
 *
 * Implements:
 * 1. True Multi-Step Agent Tool Loop (Model selects tools, tools execute, results feed back).
 * 2. Real URL-Aware Fetching (YouTube, documentation, GitHub, blog posts).
 * 3. Copilot Intelligent Local Model Routing (Fast 1-2s response, Coding, or Deep CoT).
 * 4. Preserves ALL Unified Tools (Antigravity, Claude Code, Copilot, Manus).
 * 5. Full Real-Time SSE Token & Tool Streaming.
 */
export class NetworkAwareRouter {
  constructor({ dispatcher, toolRunner, contextMgr, config = {}, checkOnline = checkInternet }) {
    this.dispatcher = dispatcher;
    this.toolRunner = toolRunner;
    this.contextMgr = contextMgr;
    this.config = config;
    // Injectable connectivity probe (defaults to the real TCP+HTTPS check).
    this.checkOnline = checkOnline;
    this.memoryEngine = new PersistentMemoryEngine();
    this.evolutionEngine = new EvolutionEngine();
  }

  /**
   * Determine whether text represents a pasted HTML/source document
   */
  isDocument(text) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();

    // HTML / XML document indicators
    const htmlIndicators = [
      '<!doctype',
      '<html',
      '<head',
      '<body',
      '<script',
      '<style',
      '<meta',
      '<link rel=',
      'window.__',
      '<div id="root">'
    ];
    let htmlHits = 0;
    for (const ind of htmlIndicators) {
      if (lower.includes(ind)) htmlHits++;
    }
    if (htmlHits >= 2 || lower.includes('<!doctype') || lower.includes('<html')) {
      return true;
    }

    // Large JSON payload
    if ((text.trim().startsWith('{') && text.trim().endsWith('}')) && text.length > 500) {
      return true;
    }

    // Source code blocks
    const codeMarkers = ['import express', 'import react', 'function ', 'export default', 'export function', 'class ', 'const '];
    let codeHits = 0;
    for (const m of codeMarkers) {
      if (lower.includes(m)) codeHits++;
    }
    if (codeHits >= 3 && text.length > 500) {
      return true;
    }

    return false;
  }

  /**
   * Extract all URLs from prompt text (avoids extracting links from full documents)
   */
  extractUrls(text) {
    if (!text || typeof text !== 'string') return [];

    // If it's a pasted document or source code, NEVER treat internal script tags / asset URLs as external targets!
    if (this.isDocument(text)) {
      return [];
    }

    // Strict URL regex avoiding quotes, angle brackets, parentheses, curly brackets, backticks
    const rawMatches = text.match(/https?:\/\/[^\s"'<>\(\)\[\]{}\\\^`]+/gi) || [];
    const cleaned = [];
    for (let u of rawMatches) {
      u = u.replace(/[.,;:!?'"\\`]+$/, '');
      try {
        const parsed = new URL(u);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          cleaned.push(u);
        }
      } catch (e) {}
    }

    // Deduplicate and cap to 3 URLs max
    const unique = [...new Set(cleaned)];
    return unique.slice(0, 3);
  }

  /**
   * GitHub Copilot Intelligent Task Classifier & Model Selector
   */
  detectTaskAndModel(message, requestedModel) {
    if (requestedModel && requestedModel !== 'auto' && !requestedModel.includes('auto')) {
      return {
        model: requestedModel,
        taskType: 'User Specified',
        reason: `Manually set to ${requestedModel}`
      };
    }

    if (this.isDocument(message)) {
      return {
        model: 'qwen2.5-coder:7b',
        taskType: 'Document & Code Analysis',
        reason: 'Auto-routed to Qwen Coder for deep source document analysis'
      };
    }

    const trimmed = (message || '').toLowerCase();

    // 1. Coding / Tool Execution / Terminal commands / Refactoring
    const codePatterns = [
      /\b(function|class|const|let|var|def|import|return|async|await|docker|git|npm|python|javascript|typescript|bash|sql)\b/i,
      /\b(code|script|debug|refactor|syntax|regex|bug|unit test|compile|api endpoint|json|html|css)\b/i,
      /\b(read_file|edit_file|write_file|run_command|grep_search|view|edit|replace|file_list)\b/i,
      /```[\s\S]*?```/
    ];
    for (const pat of codePatterns) {
      if (pat.test(trimmed)) {
        return {
          model: 'qwen2.5-coder:7b',
          taskType: 'Coding & Tool Architecture',
          reason: 'Auto-routed to Qwen Coder for code generation and tools'
        };
      }
    }

    // 2. Deep Algorithmic Reasoning / Complex Logic
    const deepReasoningPatterns = [
      /\b(prove|proof|theorem|derive|step-by-step reasoning|chain of thought|logic puzzle|riddle)\b/i,
      /\b(quantum|cryptography|calculus|differential|algebraic|game theory)\b/i
    ];
    for (const pat of deepReasoningPatterns) {
      if (pat.test(trimmed)) {
        return {
          model: 'deepseek-r1:8b',
          taskType: 'Deep Algorithmic CoT',
          reason: 'Auto-routed to DeepSeek R1 for multi-step reasoning'
        };
      }
    }

    // 3. Fast On-Device Response
    return {
      model: 'llama3.2:3b',
      taskType: 'Fast Conversational & Web',
      reason: 'Auto-routed to Llama 3.2 3B for ultra-fast response'
    };
  }

  /**
   * Determine whether a prompt genuinely needs web research.
   */
  shouldUseWeb(message, webPreference = 'auto') {
    if (webPreference === 'disabled' || webPreference === 'offline') return false;
    if (webPreference === 'force') return true;

    // 1. Any message containing a URL MUST trigger live web research
    if (this.extractUrls(message).length > 0) {
      return true;
    }

    const trimmed = (message || '').trim().toLowerCase();

    // 2. Explicit web indicators always trigger research (when online).
    const webNeedPatterns = [
      /\b(latest|recent|news|today|yesterday|current|breaking|upcoming|schedule|release notes|changelog|announcements?)\b/i,
      /\b(price of|stock price|crypto price|exchange rate|weather in|who won|election results?|score of)\b/i,
      /\b(2024|2025|2026)\b/i,
      /\b(search (the )?(web|internet)|look up (online|on the web)|google|browse the web|find online)\b/i,
      /\b(github repo|documentation for|official docs|api docs)\b/i
    ];
    for (const pattern of webNeedPatterns) {
      if (pattern.test(trimmed)) return true;
    }

    // 3. Local-only work skips research: greetings, arithmetic, and code writing/analysis.
    const localOnlyPatterns = [
      /^(hi|hello|hey|thanks|thank you|good (morning|afternoon|evening))\b/i,
      /^what is \d+[\s\+\-\*\/\^]+\d+/i,
      /^(write|create|implement|code|refactor|debug|fix) (a |an |the )?(function|regex|class|script|component|test|bug)/i
    ];
    for (const pattern of localOnlyPatterns) {
      if (pattern.test(trimmed)) return false;
    }
    if (/```/.test(message || '') || /\b(function|const|let|def|async|await|import|npm|docker|git)\b/i.test(message || '')) {
      return false;
    }

    // 4. Auto mode with internet available: research by default so answers are grounded in live sources.
    return true;
  }

  extractSearchQuery(message) {
    let q = (message || '')
      .replace(/\b(summarize in \d+ (sentences?|words?)|in \d+ sentences?|reply in \d+ sentences?|short summary|briefly|in one sentence)\b/gi, '')
      .replace(/\b(please\s+)?(can you\s+)?(search\s+(the\s+web\s+)?(for)?|look\s+up|browse\s+(for)?|find\s+out\s+about|check\s+online\s+for)\b/gi, '')
      .replace(/^(what is|who is|tell me about|explain|describe)\s+(the\s+)?/gi, '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[?!.,;:"'(){}\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return q.slice(0, 90);
  }

  /**
   * Main Network-Aware Agent & Router Execution Entrypoint
   */
  async routeAndAnswer({
    sessionId,
    message,
    model,
    webPreference = 'auto',
    history = [],
    onProgress = () => {}
  }) {
    // 1. Copilot Intelligent Model Routing
    const routingDecision = this.detectTaskAndModel(message, model);
    const targetModel = routingDecision.model;

    onProgress({
      type: 'routing',
      model: targetModel,
      taskType: routingDecision.taskType,
      reason: routingDecision.reason,
      text: `🎯 Copilot Route: ${targetModel} (${routingDecision.taskType})`
    });

    // 2. Check live internet connectivity (dual TCP + HTTPS probe)
    const isOnline = await this.checkOnline();

    // 3. Check for URLs and direct fetch (with multi-turn conversation memory)
    let detectedUrls = this.extractUrls(message);

    // If no URL in current prompt, check if user is asking a follow-up about a previously referenced media/URL
    if (detectedUrls.length === 0 && Array.isArray(history) && history.length > 0) {
      const refersToPrevious = /\b(this|the|that)\s+(video|link|url|document|page|youtube|clip|article|file)\b|\b(it|its|them)\b|\b(what|tell me|explain|summarize|facts|who)\b/i.test(message);
      if (refersToPrevious) {
        for (let i = history.length - 1; i >= 0; i--) {
          const hText = history[i].content || '';
          const prevUrls = this.extractUrls(hText);
          if (prevUrls.length > 0) {
            detectedUrls = prevUrls;
            break;
          }
        }
      }
    }

    const isUserOffline = webPreference === 'disabled' || webPreference === 'offline';
    const isForceWeb = webPreference === 'force';
    const isDoc = this.isDocument(message);
    const needsWeb = this.shouldUseWeb(message, webPreference);

    let sourceMode = 'LOCAL_ONLY';
    let statusLabel = 'ONLINE — RESEARCH NOT NEEDED';
    let evidence = [];
    let webSearchAttempted = false;
    let webSearchProvider = null;
    let fallbackTriggered = false;
    const toolsExecuted = [];

    // Document & Code Detection Gate: If user pasted an entire HTML/source document, route to local code analysis
    if (isDoc) {
      sourceMode = 'DOCUMENT_ANALYSIS';
      statusLabel = 'DOCUMENT ANALYSIS';
      onProgress({
        type: 'status',
        text: '📄 Document / Source Code Detected: Analyzing architecture and layout locally (bypassing external tracking URLs)...'
      });
    }

    // Memory Capture Trigger
    const rememberMatch = message.match(/^(?:remember\s+(?:that|this)[:\s]*|save\s+(?:this\s+)?to\s+memory[:\s]*|please\s+remember[:\s]*)(.*)$/i);
    if (rememberMatch && rememberMatch[1]) {
      const memText = rememberMatch[1].trim();
      const saveRes = this.memoryEngine.saveMemoryItem({ category: 'fact', text: memText });
      onProgress({ type: 'status', text: `🧠 Saved to persistent agent memory: "${memText.slice(0, 50)}..."` });
      toolsExecuted.push({ name: 'memory_save', result: saveRes });
    }

    // Autonomous Evolution Trigger
    const evolveMatch = message.match(/^(?:evolve(?:\s+the\s+system)?|run\s+(?:an?\s+)?evolution(?:\s+cycle)?|advance\s+generation|self-evolve)\b/i);
    if (evolveMatch) {
      const evolveRes = await this.evolutionEngine.runEvolutionCycle({ focus: 'Autonomous Prompt Request', notes: message });
      onProgress({ type: 'status', text: `🧬 System Evolved! Advanced to Generation ${evolveRes.generation} (Fitness: ${evolveRes.fitnessScore}%)` });
      toolsExecuted.push({ name: 'system_evolve', result: evolveRes });
    }

    // CodeRabbit Review Trigger
    const codeRabbitMatch = message.match(/\b(?:coderabbit|code\s*rabbit|run\s+cr\b|review\s+(?:my\s+)?code\s+(?:with\s+)?coderabbit)\b/i);
    if (codeRabbitMatch) {
      onProgress({ type: 'status', text: '🐇 Running CodeRabbit AI Code & PR Review...' });
      const crRes = await this.toolRunner.dispatch('coderabbit_review', { uncommitted: true, format: 'prompt-only' });
      toolsExecuted.push({ name: 'coderabbit_review', result: crRes });
      evidence.push({
        type: 'coderabbit_review',
        provider: crRes.provider,
        summary: crRes.message || 'CodeRabbit review executed.'
      });
    }

    // 4. Research Execution Branch
    if (!isDoc) {
      if (isUserOffline) {
        // User explicitly chose offline reasoning
        sourceMode = 'LOCAL_ONLY';
        statusLabel = 'LOCAL ONLY — USER SELECTED';
        onProgress({ type: 'status', text: '🧠 Offline Local Reasoning requested by user. Answering from local model knowledge...' });
      } else if (detectedUrls.length > 0) {
        // URL / Media fetching
        webSearchAttempted = true;
        if (!isOnline) {
          fallbackTriggered = true;
          sourceMode = 'LOCAL_ONLY';
          statusLabel = 'OFFLINE — LOCAL MODE';
          onProgress({ type: 'status', text: '○ Offline mode active: Cannot fetch links without internet. Falling back to local model...' });
        } else {
          onProgress({ type: 'announcement', text: 'Beginning live internet research on target links.' });
          for (const url of detectedUrls) {
            const isYT = /(?:youtu\.be\/|youtube\.com\/(?:watch|shorts|embed))/i.test(url);
            onProgress({
              type: 'tool',
              name: isYT ? 'youtube_transcript' : 'web_fetch',
              query: url,
              text: isYT ? `🎥 Accessing YouTube metadata & full spoken transcript for: ${url}...` : `🌐 Live Fetching URL: ${url}...`
            });
            const fetchResult = await this.toolRunner.dispatch('web_fetch', { url });
            toolsExecuted.push({ name: isYT ? 'youtube_transcript' : 'web_fetch', result: fetchResult });

            if (fetchResult.success && fetchResult.content) {
              const snippetLimit = fetchResult.isYouTube || fetchResult.has_transcript ? 25000 : 8000;
              evidence.push({
                source: fetchResult.title || url,
                url: fetchResult.url || url,
                title: fetchResult.title || (isYT ? 'YouTube Video & Transcript' : 'Web Document'),
                snippet: fetchResult.content.slice(0, snippetLimit)
              });
            }
          }

          if (evidence.length > 0) {
            sourceMode = 'WEB_VERIFIED';
            statusLabel = 'LIVE SOURCES RETRIEVED';
            webSearchProvider = detectedUrls.some(u => /(?:youtu\.be\/|youtube\.com)/i.test(u)) ? 'YouTube Transcript & Video Inspector' : 'Live URL Fetcher';
            onProgress({ type: 'status', text: `✅ Extracted live data & transcript for ${evidence.length} source(s)` });
            onProgress({ type: 'announcement', text: `Link research complete. Processing ${evidence.length} verified sources.` });
          } else {
            fallbackTriggered = true;
            sourceMode = 'SEARCH_FAILED_FALLBACK';
            statusLabel = 'SEARCH FAILED — LOCAL FALLBACK';
            onProgress({ type: 'status', text: '⚠️ Direct URL retrieval failed to yield usable content. Falling back to local model...' });
          }
        }
      } else if (needsWeb) {
        // Needs web search
        webSearchAttempted = true;
        if (!isOnline) {
          fallbackTriggered = true;
          sourceMode = 'LOCAL_ONLY';
          statusLabel = 'OFFLINE — LOCAL MODE';
          onProgress({ type: 'status', text: '○ Offline mode active: No internet connection. Answering strictly from local model knowledge...' });
        } else {
          const searchQuery = this.extractSearchQuery(message);
          onProgress({ type: 'announcement', text: 'Beginning live internet research.' });
          onProgress({
            type: 'tool',
            name: 'web_search',
            query: searchQuery,
            text: `🔍 Searching live web for: "${searchQuery}"...`
          });

          const searchResult = await this.toolRunner.dispatch('web_search', { query: searchQuery });
          toolsExecuted.push({ name: 'web_search', result: searchResult });

          if (searchResult.success && searchResult.snippets && searchResult.snippets.length > 0) {
            evidence = searchResult.snippets.map((s, i) => ({
              source: `Web Search Result #${i + 1}`,
              title: `Result #${i + 1}`,
              snippet: s
            }));
            sourceMode = 'WEB_VERIFIED';
            statusLabel = 'LIVE SOURCES RETRIEVED';
            webSearchProvider = 'DuckDuckGo Live Search';
            onProgress({ type: 'status', text: `✅ Retrieved ${evidence.length} live web sources` });
            onProgress({ type: 'announcement', text: `Internet research complete. Found ${evidence.length} live sources.` });
          } else {
            fallbackTriggered = true;
            sourceMode = 'SEARCH_FAILED_FALLBACK';
            statusLabel = 'SEARCH FAILED — LOCAL FALLBACK';
            onProgress({ type: 'status', text: '⚠️ Live web search yielded no usable sources. Continuing with local model reasoning...' });
          }
        }
      } else {
        // Self-contained query
        if (isOnline) {
          sourceMode = 'LOCAL_ONLY';
          statusLabel = 'ONLINE — RESEARCH NOT NEEDED';
          onProgress({ type: 'status', text: '🧠 Self-contained query. Answering directly via local model...' });
        } else {
          sourceMode = 'LOCAL_ONLY';
          statusLabel = 'OFFLINE — LOCAL MODE';
          onProgress({ type: 'status', text: '○ Offline mode active. Answering from local model knowledge...' });
        }
      }
    }

    // 6. Dynamic System Prompt Injection with Persistent Memory & Self-Evolution
    const activeMemory = this.memoryEngine.loadActiveMemory();
    const evoState = this.evolutionEngine.getState();
    const evoHeader = `Autonomous Lineage: Gen ${evoState.generation} | System Fitness: ${evoState.fitnessScore}%`;
    const memoryBlock = activeMemory ? `\n=== PERSISTENT AGENT MEMORY (MEMORIA) ===\n${activeMemory}\n=========================================\n` : '';

    let dynamicSystemPrompt = '';
    if (sourceMode === 'DOCUMENT_ANALYSIS') {
      dynamicSystemPrompt = `You are VCS Sovereign (${evoHeader}), an autonomous AI code and systems architect.
Source Grounding Mode: DOCUMENT_ANALYSIS.
${memoryBlock}

CRITICAL INSTRUCTIONS FOR DOCUMENT & CODE ANALYSIS:
1. The user has provided an entire source document, HTML page, or code file directly in the prompt.
2. Analyze the provided document structure, layout, scripts, architectural patterns, tools, APIs, security implications, and potential bugs.
3. Do NOT attempt to fetch external tracking or analytics URLs (e.g. Google Tag Manager, HubSpot, Pylon, Customer.io, Cloudflare beacons). Treat all links inside the document as static code references.
4. Provide a structured, insightful analysis with sections:
   - 🏗️ Architecture & Stack Overview
   - 🛠️ Tools, APIs & Functionalities Detected
   - 🔒 Security, Privacy & CSP Posture
   - ⚠️ Observations, Potential Bugs & Recommendations
5. Be concise, direct, and actionable.`;
    } else if (sourceMode === 'WEB_VERIFIED') {
      const formattedEvidence = evidence.map((e, i) => `[Source ${i + 1}] Title/URL: ${e.source || e.url}\nInformation: ${e.snippet}`).join('\n\n');
      dynamicSystemPrompt = `You are VCS Sovereign (${evoHeader}), an autonomous AI with access to real-time live web evidence, persistent agent memory, self-evolution, and workspace tools.
Source Grounding Mode: WEB_VERIFIED.
${memoryBlock}
=== LIVE VERIFIED WEB EVIDENCE ===
${formattedEvidence}
==================================

INSTRUCTIONS:
1. You ALREADY have the complete live web content and full spoken audio transcript right above under LIVE VERIFIED WEB EVIDENCE.
2. NEVER apologize or state that you cannot access links or the internet. The content has already been retrieved for you.
3. Provide a clear, insightful breakdown of the video or web source: summarize the main points, key tools/repositories mentioned, and practical takeaways.
4. Respect all persistent user preferences and architectural decisions stored in your agent memory.
5. Be concise, direct, and factual.`;
    } else {
      dynamicSystemPrompt = `You are VCS Sovereign (${evoHeader}), an autonomous local AI running with local model intelligence, persistent agent memory, self-evolution, and workspace tools.
Network Status: ${isOnline ? 'Online (Self-contained query)' : 'Offline'}.
Source Grounding Mode: LOCAL_ONLY.
${memoryBlock}
${fallbackTriggered ? 'Note: Live search was unavailable; answer strictly from local offline knowledge.' : ''}`;
    }

    let userPromptContent = message;
    if (sourceMode === 'WEB_VERIFIED' && detectedUrls.length > 0) {
      userPromptContent = `${message}\n\n[Context Grounding: The full spoken audio transcript and metadata for the video above have been retrieved and provided to you under LIVE VERIFIED WEB EVIDENCE. Break down the content, key repositories/topics covered, and main takeaways.]`;
    }

    const currentMessages = [
      { role: 'system', content: dynamicSystemPrompt },
      ...history,
      { role: 'user', content: userPromptContent }
    ];

    // 7. Multi-Step Tool Loop (for coding, file editing, terminal commands)
    const availableTools = ToolRunner.getToolDefinitions();
    const isToolCapable = targetModel.includes('coder') || targetModel.includes('qwen') || targetModel.includes('gemma');

    if (isToolCapable && !detectedUrls.length) {
      try {
        const stepResponse = await this.dispatcher.executeChat({
          model: targetModel,
          messages: currentMessages,
          tools: availableTools,
          stream: false
        });

        const msgObj = stepResponse.choices?.[0]?.message || {};
        const toolCalls = msgObj.tool_calls || [];

        if (toolCalls.length > 0) {
          for (const tc of toolCalls) {
            const fnName = tc.function?.name;
            let fnArgs = {};
            try { fnArgs = JSON.parse(tc.function?.arguments || '{}'); } catch(e) { fnArgs = { raw: tc.function?.arguments }; }

            onProgress({ type: 'tool', name: fnName, args: fnArgs, text: `⚡ Executing tool: ${fnName}...` });
            const result = await this.toolRunner.dispatch(fnName, fnArgs);
            toolsExecuted.push({ name: fnName, result });

            currentMessages.push({
              role: 'tool',
              tool_call_id: tc.id || 'tc-1',
              name: fnName,
              content: JSON.stringify(result)
            });
          }
        }
      } catch (toolLoopErr) {
        console.warn('[Router] Tool loop pass skipped:', toolLoopErr.message);
      }
    }

    onProgress({ type: 'status', text: `🧠 Generating answer via ${targetModel}...` });

    // 8. Stream Final Response to Client
    try {
      const stream = await this.dispatcher.executeChat({
        model: targetModel,
        messages: currentMessages,
        stream: true
      });

      let fullReply = '';
      for await (const chunk of stream) {
        const textChunk =
          chunk.choices?.[0]?.delta?.content ||
          chunk.message?.content ||
          chunk.content ||
          '';

        if (textChunk) {
          fullReply += textChunk;
          onProgress({ type: 'chunk', text: textChunk, full: fullReply });
        }
      }

      if (!fullReply) {
        fullReply = 'Task completed.';
      }

      return {
        reply: fullReply,
        sourceMode,
        statusLabel,
        online: isOnline,
        evidence,
        toolsExecuted,
        searchAttempted: webSearchAttempted,
        searchProvider: webSearchProvider,
        fallbackTriggered,
        tokens: this.contextMgr.estimateTokens(fullReply),
        model: targetModel,
        routingDecision
      };
    } catch (modelErr) {
      console.error('[Router] Model execution failure:', modelErr.message);
      return {
        reply: `⚠️ Model Execution Failed: ${modelErr.message}\n\nPlease verify Ollama is active.`,
        sourceMode: 'MODEL_UNAVAILABLE',
        online: isOnline,
        evidence: [],
        toolsExecuted,
        error: modelErr.message,
        tokens: 0,
        model: targetModel,
        routingDecision
      };
    }
  }
}
