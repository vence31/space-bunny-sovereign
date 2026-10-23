#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { createServer } from '../lib/server.js';
import { ProviderDispatcher } from '../lib/dispatcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load YAML Configuration
const configPath = path.resolve(__dirname, '../config/sbh.config.yaml');
let config = {};
try {
  const fileContents = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(fileContents);
} catch (e) {
  console.error('[SBH] Warning: could not load config file, using defaults.', e.message);
}

const program = new Command();

program
  .name('sbh')
  .description('Space Bunny Harness (SBH) - 1,000,000 Token Agentic Orchestration Runtime')
  .version('1.0.0');

program
  .command('web')
  .description('Launch the Space Bunny Harness web interface on port 3090')
  .option('-p, --port <number>', 'Port to listen on', config.harness?.port || 3090)
  .action((options) => {
    config.harness.port = parseInt(options.port, 10);
    const server = createServer(config);
    server.start();
  });

program
  .command('run')
  .description('Run a single prompt through Space Bunny Harness in headless mode')
  .argument('<prompt>', 'Task prompt to execute')
  .option('-m, --model <name>', 'Model to use', config.defaultModel || 'space-bunny-alpha')
  .action(async (prompt, options) => {
    console.log(`[SBH Headless] Executing prompt with 1M context engine...`);
    const dispatcher = new ProviderDispatcher(config);
    try {
      const resp = await dispatcher.executeChat({
        model: options.model,
        messages: [
          { role: 'system', content: 'You are Space Bunny Harness, an autonomous coding agent with a 1,000,000-token context window.' },
          { role: 'user', content: prompt }
        ]
      });
      console.log('\n=== Output ===');
      console.log(resp.choices?.[0]?.message?.content || 'No output.');
    } catch (err) {
      console.error('[SBH Headless Error]:', err.message);
    }
  });

program.parse(process.argv);
