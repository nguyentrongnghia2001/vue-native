#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const MAX_FILE_SIZE_BYTES = 1024 * 1024;

const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.zip',
  '.gz',
  '.jar',
  '.keystore',
  '.jks',
  '.p12',
  '.mobileprovision',
  '.pdf',
  '.lockb',
]);

const SKIP_PATH_SEGMENTS = [
  '/node_modules/',
  '/.git/',
  '/apps/sandbox/android/build/',
  '/apps/sandbox/.expo/',
  '/coverage/',
  '/dist/',
  '/temp/',
];

const SECRET_PATTERNS = [
  {
    name: 'Private key block',
    regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY-----/,
  },
  {
    name: 'AWS access key id',
    regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/,
  },
  {
    name: 'GitHub token (classic/app/user)',
    regex: /\b(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{36}\b/,
  },
  {
    name: 'GitHub fine-grained token',
    regex: /\bgithub_pat_[A-Za-z0-9_]{80,}\b/,
  },
  {
    name: 'NPM automation token',
    regex: /\bnpm_[A-Za-z0-9]{36}\b/,
  },
  {
    name: 'Slack token',
    regex: /\bxox(?:b|p|a|r|s)-[A-Za-z0-9-]{10,}\b/,
  },
  {
    name: 'Stripe live secret key',
    regex: /\bsk_live_[0-9A-Za-z]{16,}\b/,
  },
  {
    name: 'JWT-like bearer token',
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
];

const findings = [];
const trackedFiles = listTrackedFiles();

for (const relativePath of trackedFiles) {
  if (shouldSkip(relativePath)) {
    continue;
  }

  if (isTrackedEnvFile(relativePath)) {
    findings.push({
      path: relativePath,
      line: 1,
      type: 'Tracked environment file',
      snippet: path.basename(relativePath),
    });
    continue;
  }

  let stat;
  try {
    stat = statSync(relativePath);
  } catch {
    continue;
  }

  if (!stat.isFile() || stat.size > MAX_FILE_SIZE_BYTES) {
    continue;
  }

  let content;
  try {
    content = readFileSync(relativePath, 'utf8');
  } catch {
    continue;
  }

  if (isLikelyBinary(content)) {
    continue;
  }

  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push({
          path: relativePath,
          line: index + 1,
          type: pattern.name,
          snippet: line.trim().slice(0, 140),
        });
      }
    }
  }
}

if (findings.length > 0) {
  console.error(`[security] Potential secret exposures found: ${findings.length}`);
  for (const finding of findings) {
    console.error(
      `[security] ${finding.path}:${finding.line} -> ${finding.type} | ${finding.snippet}`,
    );
  }
  process.exit(1);
}

console.log(`[security] Secret scan passed (${trackedFiles.length} tracked files checked).`);

function listTrackedFiles() {
  const command = process.platform === 'win32' ? 'git.exe' : 'git';
  const output = execFileSync(command, ['ls-files', '-z'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return output.split('\0').filter(Boolean);
}

function shouldSkip(relativePath) {
  const normalized = `/${relativePath.replace(/\\/g, '/')}`;

  for (const segment of SKIP_PATH_SEGMENTS) {
    if (normalized.includes(segment)) {
      return true;
    }
  }

  const extension = path.extname(relativePath).toLowerCase();
  return SKIP_EXTENSIONS.has(extension);
}

function isTrackedEnvFile(relativePath) {
  const baseName = path.basename(relativePath);
  return baseName.startsWith('.env') && baseName !== '.env.example';
}

function isLikelyBinary(content) {
  return content.includes('\u0000');
}
