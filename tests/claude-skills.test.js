#!/usr/bin/env node
// scripts/claude-skills.js: the no-plugin Claude Code install must copy the six
// skills, keep the user's own CLAUDE.md text, replace (never duplicate) its block
// on re-run, and take only its own files and block away on uninstall.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const skills = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name);

for (const key of ['CLAUDE_CONFIG_DIR', 'PONYTAIL_DEFAULT_MODE', 'XDG_CONFIG_HOME']) delete process.env[key];

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ponytail-claude-skills-'));
process.on('exit', () => fs.rmSync(temp, { recursive: true, force: true }));

function cli(action, claudeDir, env = {}) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'claude-skills.js'), action], {
    env: { ...process.env, CLAUDE_CONFIG_DIR: claudeDir, XDG_CONFIG_HOME: path.join(temp, 'xdg'), ...env },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return result;
}

test('install copies the skills and adds one ruleset block next to the user text', () => {
  const dir = fs.mkdtempSync(path.join(temp, 'case-'));
  const memory = path.join(dir, 'CLAUDE.md');
  fs.writeFileSync(memory, '# Mine\n\nKeep this.\n');

  cli('install', dir);
  cli('install', dir);

  assert.equal(skills.length, 6);
  for (const name of skills) assert.ok(fs.existsSync(path.join(dir, 'skills', name, 'SKILL.md')), name);
  const text = fs.readFileSync(memory, 'utf8');
  assert.ok(text.startsWith('# Mine\n\nKeep this.\n\n<!-- ponytail:begin'), text.slice(0, 80));
  assert.equal(text.match(/ponytail:begin/g).length, 1);
  assert.match(text, /PONYTAIL MODE ACTIVE — level: full/);
  assert.ok(text.endsWith('<!-- ponytail:end -->\n'));
});

test('re-install switches the level; off drops the block but keeps the skills', () => {
  const dir = fs.mkdtempSync(path.join(temp, 'case-'));
  const memory = path.join(dir, 'CLAUDE.md');

  cli('install', dir);
  cli('install', dir, { PONYTAIL_DEFAULT_MODE: 'ultra' });
  const ultra = fs.readFileSync(memory, 'utf8');
  assert.match(ultra, /level: ultra/);
  assert.doesNotMatch(ultra, /level: full/);
  assert.equal(ultra.match(/ponytail:begin/g).length, 1);
  // Only the active level's table row survives, and the skill's frontmatter is stripped.
  assert.match(ultra, /\| \*\*ultra\*\* \|/);
  assert.doesNotMatch(ultra, /\| \*\*(lite|full)\*\* \|/);
  assert.doesNotMatch(ultra, /argument-hint:/);

  fs.writeFileSync(memory, 'Mine.\n\n' + ultra);
  cli('install', dir, { PONYTAIL_DEFAULT_MODE: 'off' });
  assert.equal(fs.readFileSync(memory, 'utf8'), 'Mine.\n');
  assert.ok(fs.existsSync(path.join(dir, 'skills', 'ponytail', 'SKILL.md')));
});

test('the level comes from the config file; an unknown env level falls back to it', () => {
  const dir = fs.mkdtempSync(path.join(temp, 'case-'));
  const xdg = path.join(dir, 'xdg');
  fs.mkdirSync(path.join(xdg, 'ponytail'), { recursive: true });
  fs.writeFileSync(path.join(xdg, 'ponytail', 'config.json'), '﻿{ "defaultMode": "lite" }');

  cli('install', dir, { XDG_CONFIG_HOME: xdg, PONYTAIL_DEFAULT_MODE: 'review' });
  assert.match(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8'), /level: lite/);
});

test('uninstall removes only ponytail skills and block', () => {
  const dir = fs.mkdtempSync(path.join(temp, 'case-'));
  const memory = path.join(dir, 'CLAUDE.md');
  fs.mkdirSync(path.join(dir, 'skills', 'other'), { recursive: true });
  fs.writeFileSync(memory, 'Mine.\n');

  cli('install', dir);
  cli('uninstall', dir);

  assert.equal(fs.readFileSync(memory, 'utf8'), 'Mine.\n');
  assert.deepEqual(fs.readdirSync(path.join(dir, 'skills')), ['other']);

  // Nothing of ponytail's left: uninstall leaves a CLAUDE.md without a block untouched.
  fs.writeFileSync(memory, 'Mine.  \n\n\n');
  cli('uninstall', dir);
  assert.equal(fs.readFileSync(memory, 'utf8'), 'Mine.  \n\n\n');
});
