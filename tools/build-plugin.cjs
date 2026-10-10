'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const defaultPlugin = path.join(root, fs.existsSync(path.join(root, 'com.llwhite.happtoggle.sdPlugin')) ? 'com.llwhite.happtoggle.sdPlugin' : 'com.user.happtoggle.sdPlugin');
const plugin = path.resolve(process.argv[2] || defaultPlugin);
const manifest = JSON.parse(fs.readFileSync(path.join(plugin, 'manifest.json'), 'utf8'));
if (manifest.SDKVersion !== 3 || manifest.CodePath !== 'bin/plugin.js') throw new Error('Expected SDK3 manifest and bin/plugin.js entry.');

(async () => {
  fs.mkdirSync(path.join(plugin, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(plugin, 'bin/package.json'), '{ "type": "module" }\n');
  const result = await esbuild.build({
    entryPoints: [path.join(plugin, 'plugin.js')],
    outfile: path.join(plugin, 'bin/plugin.js'),
    bundle: true, platform: 'node', target: 'node20', format: 'esm',
    banner: { js: "import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url'; import { dirname, resolve } from 'node:path'; const require = createRequire(import.meta.url); const __dirname = resolve(dirname(fileURLToPath(import.meta.url)), '..');" },
    nodePaths: [path.join(__dirname, 'node_modules')],
    legalComments: 'eof', metafile: true, sourcemap: false,
  });
  if (result.warnings.length) throw new Error('Bundle warnings require review.');
  execFileSync(process.execPath, ['--check', path.join(plugin, 'bin/plugin.js')]);
  const packages = new Set();
  for (const input of Object.keys(result.metafile.inputs)) {
    let dir = path.dirname(path.resolve(input));
    while (dir !== path.dirname(dir)) {
      const file = path.join(dir, 'package.json');
      if (fs.existsSync(file)) {
        const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (dir.includes('node_modules')) packages.add(dir);
        break;
      }
      dir = path.dirname(dir);
    }
  }
  let notices = '# Bundled runtime dependency licenses\n\nGenerated from the pinned dependencies used by tools/build-plugin.cjs.\n';
  for (const dir of [...packages].sort()) {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const file = fs.readdirSync(dir).find((name) => /^licen[cs]e(\.|$)/i.test(name));
    if (!file) throw new Error('Missing dependency license: ' + pkg.name);
    notices += '\n## ' + pkg.name + ' ' + pkg.version + '\n\n' + fs.readFileSync(path.join(dir, file), 'utf8').trim() + '\n';
  }
  fs.writeFileSync(path.join(plugin, 'THIRD_PARTY_LICENSES.txt'), notices);
  console.log('Built official SDK runtime:', manifest.UUID);
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
