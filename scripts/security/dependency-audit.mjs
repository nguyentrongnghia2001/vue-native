#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';

const allowedLevels = new Set(['low', 'moderate', 'high', 'critical']);
const cliArgs = process.argv.slice(2);

let level = process.env.SECURITY_AUDIT_LEVEL ?? 'high';
let includeDevDependencies = false;
let outputJson = false;

main().catch((error) => {
  console.error(`[security] Failed to execute dependency audit: ${error.message}`);
  process.exit(1);
});

async function main() {
  parseCliArgs();

  if (!allowedLevels.has(level)) {
    fail(`Invalid audit level \"${level}\". Use one of: ${Array.from(allowedLevels).join(', ')}`);
  }

  const auditArgs = ['audit', '--audit-level', level];
  if (!includeDevDependencies) {
    auditArgs.push('--prod');
  }
  if (outputJson) {
    auditArgs.push('--json');
  }

  const workspacePackages = listWorkspacePackages();
  if (workspacePackages.length === 0) {
    fail('No workspace packages found to audit.');
  }

  console.log('[security] Running dependency audit with policy settings:');
  console.log(
    `[security] audit-level=${level}, includeDev=${includeDevDependencies}, workspaces=${workspacePackages.length}`,
  );

  const failedPackages = [];

  for (const pkg of workspacePackages) {
    console.log(`[security] Auditing ${pkg.name} (${pkg.path})`);
    const exitCode = await runAuditForPackage(pkg.path, auditArgs);

    if (exitCode !== 0) {
      failedPackages.push(pkg.name);
    }
  }

  if (failedPackages.length > 0) {
    console.error('[security] Dependency audit failed for workspace packages:');
    for (const packageName of failedPackages) {
      console.error(`[security] - ${packageName}`);
    }
    process.exit(1);
  }

  console.log('[security] Dependency audit passed for all workspace packages.');
}

function parseCliArgs() {
  for (let i = 0; i < cliArgs.length; i += 1) {
    const arg = cliArgs[i];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (arg === '--include-dev') {
      includeDevDependencies = true;
      continue;
    }

    if (arg === '--json') {
      outputJson = true;
      continue;
    }

    if (arg.startsWith('--level=')) {
      level = arg.slice('--level='.length);
      continue;
    }

    if (arg === '--level') {
      const candidate = cliArgs[i + 1];
      if (!candidate) {
        fail('Missing value for --level.');
      }

      level = candidate;
      i += 1;
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }
}

function listWorkspacePackages() {
  const result = spawnSync('pnpm', ['m', 'ls', '--depth', '-1', '--json'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const details = result.stderr?.trim() || `exit code ${result.status}`;
    throw new Error(`Unable to list workspace packages: ${details}`);
  }

  const output = result.stdout ?? '[]';

  const parsed = JSON.parse(output);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.name === 'string' &&
      typeof item.path === 'string',
  );
}

function runAuditForPackage(cwd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Dependency audit terminated by signal: ${signal}`));
        return;
      }

      resolve(code ?? 1);
    });
  });
}

function printHelp() {
  console.log('Usage: node scripts/security/dependency-audit.mjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --level <low|moderate|high|critical>  Severity threshold (default: high)');
  console.log('  --include-dev                          Include devDependencies in audit');
  console.log('  --json                                 Forward --json output from pnpm audit');
  console.log('  -h, --help                             Show this help message');
}

function fail(message) {
  console.error(`[security] ${message}`);
  process.exit(1);
}
