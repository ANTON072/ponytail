#!/usr/bin/env node
// ponytail — install or remove ponytail in Claude Code without the plugin, for
// setups where an admin blocks plugin hooks (allowManagedHooksOnly) or the
// marketplace (strictKnownMarketplaces). Copies the six skills to
// ~/.claude/skills and writes the ruleset for the default level into a marked
// block of ~/.claude/CLAUDE.md, the job the SessionStart hook does in the
// plugin. CLAUDE_CONFIG_DIR overrides ~/.claude. Re-run install after a pull.
//
//   node scripts/claude-skills.js install
//   node scripts/claude-skills.js uninstall

const fs = require('fs');
const path = require('path');
const { getClaudeDir, getDefaultMode } = require('./ponytail-config');
const { getPonytailInstructions } = require('./ponytail-instructions');

const SKILLS = path.join(__dirname, '..', 'skills');
const BEGIN = '<!-- ponytail:begin (written by scripts/claude-skills.js; edits here are overwritten) -->';
const END = '<!-- ponytail:end -->';
const BLOCK = /<!-- ponytail:begin[^>]*-->[\s\S]*?<!-- ponytail:end -->/;

function skillNames() {
  return fs.readdirSync(SKILLS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
}

function memoryPath() {
  return path.join(getClaudeDir(), 'CLAUDE.md');
}

// Missing file → ''. Any other read error throws, so the user's CLAUDE.md is never overwritten blind.
function readMemory(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    return '';
  }
}

// Replaces ponytail's block in CLAUDE.md, or drops it when block is ''; the rest of the file stays.
function writeBlock(block) {
  const file = memoryPath();
  const text = readMemory(file);
  if (!block && !BLOCK.test(text)) return;
  const next = [text.replace(BLOCK, '').trimEnd(), block].filter(Boolean).join('\n\n');
  fs.writeFileSync(file, next && next + '\n', 'utf8');
}

function install() {
  for (const name of skillNames()) {
    fs.cpSync(path.join(SKILLS, name), path.join(getClaudeDir(), 'skills', name), { recursive: true, force: true });
  }
  const mode = getDefaultMode();
  // Default level "off": skills only, no always-on ruleset.
  writeBlock(mode === 'off' ? '' : BEGIN + '\n' + getPonytailInstructions(mode).trim() + '\n' + END);
  return mode;
}

function uninstall() {
  for (const name of skillNames()) {
    fs.rmSync(path.join(getClaudeDir(), 'skills', name), { recursive: true, force: true });
  }
  writeBlock('');
}

if (require.main === module) {
  const action = process.argv[2];
  try {
    if (action === 'install') {
      const mode = install();
      console.log('Installed the ponytail skills in ' + path.join(getClaudeDir(), 'skills'));
      console.log(mode === 'off'
        ? 'Default level is off: no ruleset in ' + memoryPath()
        : 'Wrote the ' + mode + ' ruleset to ' + memoryPath() + '; start a new Claude Code session.');
    } else if (action === 'uninstall') {
      uninstall();
      console.log('Removed the ponytail skills and the ruleset block in ' + memoryPath());
    } else {
      console.error('usage: node scripts/claude-skills.js install|uninstall');
      process.exit(1);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = { install, uninstall };
