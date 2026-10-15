'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const tests = path.resolve(__dirname, '../tests');
const files = fs.readdirSync(tests).filter((name) => name.endsWith('.test.js')).sort().map((name) => path.join(tests, name));
for (const args of [['--test', ...files], [path.join(__dirname, 'test-sdk.cjs')], [path.join(__dirname, 'test-i18n.cjs')]]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('All offline tests passed. Public service throughput and physical Stream Deck controls are separate checks.');
