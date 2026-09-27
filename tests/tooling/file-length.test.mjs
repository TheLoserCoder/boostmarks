import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const checker = resolve('scripts/check-file-length.mjs');

function withFixture(files, verify) {
  const root = mkdtempSync(join(tmpdir(), 'boostmarks-lines-'));
  try {
    for (const [path, contents] of Object.entries(files)) {
      const target = join(root, path);
      mkdirSync(join(target, '..'), { recursive: true });
      writeFileSync(target, contents);
    }
    verify(spawnSync(process.execPath, [checker, root], { encoding: 'utf8' }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('accepts authored code up to 500 physical lines', () => {
  withFixture({ 'app/short.ts': 'export {}\n'.repeat(500) }, result => {
    assert.equal(result.status, 0, result.stderr);
  });
});

test('rejects a 501-line TypeScript file by path', () => {
  withFixture({ 'app/long.ts': 'export {}\n'.repeat(501) }, result => {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /app\/long\.ts.*501/);
  });
});

test('checks CSS and preserved legacy source too', () => {
  withFixture({ 'app/features/style.css': 'a {}\n'.repeat(501), 'src/legacy.js': 'x();\n'.repeat(501) }, result => {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /app\/features\/style\.css.*501/);
    assert.match(result.stderr, /src\/legacy\.js.*501/);
  });
});

test('does not block on vendored/generated artifacts', () => {
  withFixture({ '.agents/skills/external/AGENTS.md': 'line\n'.repeat(501), 'package-lock.json': 'line\n'.repeat(501) }, result => {
    assert.equal(result.status, 0, result.stderr);
  });
});
