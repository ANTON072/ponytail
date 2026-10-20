#!/usr/bin/env node
// Ponytail instruction builder: the SKILL.md ruleset for one level, which
// scripts/claude-skills.js writes into CLAUDE.md.

const fs = require('fs');
const path = require('path');
const { DEFAULT_MODE, normalizeMode } = require('./ponytail-config');

const SKILL_PATH = path.join(__dirname, '..', 'skills', 'ponytail', 'SKILL.md');

function getPonytailInstructions(mode) {
  const effectiveMode = normalizeMode(mode) || DEFAULT_MODE;
  const body = fs.readFileSync(SKILL_PATH, 'utf8').replace(/^---[\s\S]*?---\s*/, '');

  // Only the intensity table rows are mode-specific, keyed by a mode name
  // (lite/full/ultra); every other line is a rule and is kept verbatim.
  const rules = body.split(/\r?\n/).filter((line) => {
    const tableLabel = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|/);
    const labelMode = tableLabel && normalizeMode(tableLabel[1].trim());
    return !labelMode || labelMode === effectiveMode;
  });
  return 'PONYTAIL MODE ACTIVE — level: ' + effectiveMode + '\n\n' + rules.join('\n');
}

module.exports = { getPonytailInstructions };
