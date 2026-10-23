import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

/**
 * Space Bunny Harness Provider Dispatcher with Dynamic Discovery
 * Directly handles Space Bunny (1M tokens), Ollama, and LM Studio.
 */
export class ProviderDispatcher {
  constructor(config = {}) {
    this.config = config;
    this.spaceBunnyKey = process.env.SPACE_BUNNY_API_KEY || '';
    this.spaceBunnyClient = new OpenAI({
      baseURL: config.providers?.spacebunny?.baseURL || 'https://spacebunnymodel.com/api/v1',
      apiKey: this.spaceBunnyKey || 'dummy-sb-key'
    });

    this.ollamaClient = new OpenAI({
      baseURL: config.providers?.['ollama-local']?.baseURL || 'http://127.0.0.1:11434/v1',
      apiKey: 'ollama'
    });

    this.lmStudioClient = new OpenAI({
      baseURL: 'http://127.0.0.1:1234/v1',
      apiKey: 'lm-studio'
    });
  }

  /**
   * Automatic Discovery of Installed Local Models (Ollama & LM Studio)
   * As featured in Copilot Local Model Routing
   */
  async discoverModels() {
    const discovered = [];

    // 1. Discover from Ollama
    try {
      const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        for (const m of (data.models || [])) {
          let category = 'general';
          if (m.name.includes('coder') || m.name.includes('code')) category = 'code';
          else if (m.name.includes('r1') || m.name.includes('reason') || m.name.includes('14b') || m.name.includes('gemma4')) category = 'reasoning';
          else if (m.name.includes('1b') || m.name.includes('3b')) category = 'fast';

          discovered.push({
            id: m.name,
            name: m.name,
            provider: 'Ollama (Local)',
            category,
            size: m.size ? `${(m.size / 1e9).toFixed(1)} GB` : 'Local'
          });
        }
      }
    } catch (e) {}

    // 2. Discover from LM Studio if active
    try {
      const res = await fetch('http://127.0.0.1:1234/v1/models', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        for (const m of (data.data || [])) {
          discovered.push({
            id: m.id,
            name: m.id,
            provider: 'LM Studio (Local)',
            category: 'general',
            size: 'Local'
          });
        }
      }
    } catch (e) {}

    return discovered;
  }

  async executeChat({ model, messages, tools, stream = false }) {
    const isSpaceBunny = model && model.includes('space-bunny');

    if (isSpaceBunny) {
      if (!this.spaceBunnyKey) {
        console.warn('[SBH] SPACE_BUNNY_API_KEY is not set. Gracefully failing over to Local Ollama...');
        return this.executeOllama({ messages, tools, stream });
      }

      try {
        console.log(`[SBH] Executing via Space Bunny (${model}) [1M Context Mode]...`);
        const payload = {
          model,
          messages,
          stream
        };
        if (tools && tools.length > 0) payload.tools = tools;
        return await this.spaceBunnyClient.chat.completions.create(payload);
      } catch (err) {
        console.error(`[SBH] Space Bunny API call failed: ${err.message}. Triggering Local Ollama fallback...`);
        return this.executeOllama({ messages, tools, stream });
      }
    } else {
      return this.executeOllama({ model, messages, tools, stream });
    }
  }

  async executeOllama({ model = 'llama3.2:3b', messages, tools, stream = false }) {
    console.log(`[SBH] Executing via Local Ollama (${model})...`);
    const payload = {
      model,
      messages,
      stream,
      max_tokens: 1024
    };
    if (tools && tools.length > 0) payload.tools = tools;
    return await this.ollamaClient.chat.completions.create(payload);
  }
}
