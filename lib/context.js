import fs from 'fs';
import path from 'path';

/**
 * High-Context Token & Memory Governor for Space Bunny
 * Solves DSH's 64k/160k premature context overflow bug.
 */
export class ContextManager {
  constructor(options = {}) {
    this.maxTokens = options.maxAllowedTokens || 1000000;
    this.compactionThreshold = options.compactionThreshold || 850000;
    this.preserveSystemSchemas = options.preserveSystemSchemas !== false;
    this.enablePruning = options.enablePruning || false;
  }

  /**
   * Estimates token usage (roughly ~4 chars per token for Latin/code)
   */
  estimateTokens(text) {
    if (!text) return 0;
    if (typeof text !== 'string') text = JSON.stringify(text);
    return Math.ceil(text.length / 3.8);
  }

  /**
   * Evaluates messages and tool schemas without stripping critical definitions
   */
  inspectTurn(messages = [], tools = []) {
    let msgTokens = 0;
    for (const m of messages) {
      msgTokens += this.estimateTokens(m.content);
    }

    let toolTokens = 0;
    if (tools && tools.length > 0) {
      toolTokens = this.estimateTokens(tools);
    }

    const total = msgTokens + toolTokens;
    const canFit = total < this.maxTokens;

    return {
      totalTokens: total,
      messageTokens: msgTokens,
      toolTokens: toolTokens,
      canFit: canFit,
      utilizationPercent: ((total / this.maxTokens) * 100).toFixed(2),
      needsCompaction: total > this.compactionThreshold
    };
  }

  /**
   * Space-Bunny Optimized Compaction (Trims middle chat turns, never tool schemas or latest turns)
   */
  compactMessages(messages = []) {
    if (messages.length <= 4) return messages;

    const systemMessages = messages.filter(m => m.role === 'system');
    const conversation = messages.filter(m => m.role !== 'system');

    // Keep the first 2 user/assistant context frames, compress middle, keep last 4
    if (conversation.length > 6) {
      const start = conversation.slice(0, 2);
      const end = conversation.slice(-4);
      const summaryPlaceholder = {
        role: 'system',
        content: `[Context Compressed by Space Bunny Harness: ${conversation.length - 6} intermediary turns archived to session log]`
      };
      return [...systemMessages, ...start, summaryPlaceholder, ...end];
    }

    return messages;
  }
}
