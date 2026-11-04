#!/usr/bin/env node
/**
 * Launch a Cursor cloud agent to refresh site content (watches, timeline,
 * apps, news, repairs). Requires CURSOR_API_KEY.
 *
 * Usage:
 *   CURSOR_API_KEY=... npm run refresh-content
 *   CURSOR_API_KEY=... node scripts/refresh-content.mjs --dry-run
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent, CursorAgentError } from '@cursor/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROMPT_PATH = join(ROOT, 'scripts', 'content-refresh-prompt.md');

const apiKey = (process.env.CURSOR_API_KEY || '').trim();
const repoUrl =
  process.env.CONTENT_REFRESH_REPO ||
  'https://github.com/TechJeeper/PebbleJunkiesWebsite';
const startingRef = process.env.CONTENT_REFRESH_REF || 'main';
const modelId = process.env.CURSOR_MODEL || 'composer-2.5';
const dryRun = process.argv.includes('--dry-run');
const autoCreatePR = process.env.CONTENT_REFRESH_AUTO_PR !== 'false';

const basePrompt = readFileSync(PROMPT_PATH, 'utf8');
const stampedPrompt = `${basePrompt}

---

## Run context

- Scheduled at: ${new Date().toISOString()}
- Target repo: ${repoUrl} @ ${startingRef}
- Open a PR when done (do not merge yourself).
- If nothing material changed after research, make no file edits and say so clearly in your final message.
`;

if (dryRun) {
  console.log('Dry run — prompt only:\n');
  console.log(stampedPrompt.slice(0, 1200) + '\n…');
  process.exit(0);
}

if (!apiKey) {
  console.error('Missing CURSOR_API_KEY. Add it as a GitHub Actions secret or export it locally.');
  process.exit(1);
}

console.log(`Starting Cursor cloud agent`);
console.log(`  repo:  ${repoUrl}`);
console.log(`  ref:   ${startingRef}`);
console.log(`  model: ${modelId}`);
console.log(`  PR:    ${autoCreatePR}`);

try {
  const result = await Agent.prompt(stampedPrompt, {
    apiKey,
    model: { id: modelId },
    cloud: {
      repos: [{ url: repoUrl, startingRef }],
      autoCreatePR,
      skipReviewerRequest: true,
      metadata: {
        job: 'pebblejunkies-content-refresh',
        triggered_by: process.env.GITHUB_ACTOR || 'local',
        run_id: process.env.GITHUB_RUN_ID || 'local',
      },
    },
  });

  console.log(`status: ${result.status}`);
  if (result.id) console.log(`run:    ${result.id}`);
  if (result.result) console.log(`\n${result.result}\n`);

  if (result.status === 'error') {
    process.exit(2);
  }
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error(`Cursor agent failed to start: ${err.message}`);
    console.error(`retryable=${err.isRetryable}`);
    process.exit(1);
  }
  throw err;
}
