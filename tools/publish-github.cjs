'use strict';
const fs = require('node:fs');
const path = require('node:path');
const token = process.env.GH_TOKEN;
const root = path.resolve(process.argv[2] || path.join(__dirname, '../publish/1.12'));
const source = path.join(root, 'github');
const owner = 'llWHiTE', name = 'happ-toggle';
if (!token) { console.error('GH_TOKEN must be provided in the process environment.'); process.exit(1); }
const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
  'User-Agent': 'Happ-Toggle-release-tool', 'X-GitHub-Api-Version': '2022-11-28' };
async function api(method, endpoint, body, allowMissing = false) {
  const response = await fetch('https://api.github.com' + endpoint, { method, headers: { ...headers,
    ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: 'error' });
  if (response.status === 404 && allowMissing) return null;
  if (!response.ok) throw new Error(`GitHub request failed: HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.git' || /^\.env/.test(entry.name) || /\.(log|bin|tmp)$/.test(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
(async () => {
  const user = await api('GET', '/user');
  if (user.login.toLowerCase() !== owner.toLowerCase()) throw new Error('Authenticated account does not match the requested publisher.');
  console.log('Authenticated publisher:', user.login);
  const prefix = `/repos/${owner}/${name}`;
  if (await api('GET', prefix, null, true)) throw new Error('Repository already exists; refusing to overwrite its files or history.');
  const inputs = files(source);
  for (const file of inputs) {
    if (/gh[pousr]_[A-Za-z0-9]{30,}/.test(fs.readFileSync(file).toString('utf8'))) throw new Error('Potential credential in prepared source; upload stopped.');
  }
  const assets = ['dist/com.llwhite.happtoggle.streamDeckPlugin', 'happ-toggle-github-source-1.12.zip', 'happ-toggle-publication-kit-1.12.zip'];
  for (const asset of assets) if (!fs.existsSync(path.join(root, asset))) throw new Error('A required release asset is missing.');
  const repo = await api('POST', '/user/repos', { name, private: false, auto_init: true,
    description: 'Happ VPN control and measured speed for Stream Deck keys, dials and Neo Infobar on Windows.', homepage: 'https://github.com/llWHiTE' });
  console.log('Repository created:', repo.html_url);
  const branch = repo.default_branch;
  const ref = await api('GET', `${prefix}/git/ref/heads/${encodeURIComponent(branch)}`);
  const base = await api('GET', `${prefix}/git/commits/${ref.object.sha}`);
  const tree = [];
  for (const file of inputs) {
    const blob = await api('POST', `${prefix}/git/blobs`, { content: fs.readFileSync(file).toString('base64'), encoding: 'base64' });
    tree.push({ path: path.relative(source, file).replace(/\\/g, '/'), mode: '100644', type: 'blob', sha: blob.sha });
  }
  const createdTree = await api('POST', `${prefix}/git/trees`, { base_tree: base.tree.sha, tree });
  const commit = await api('POST', `${prefix}/git/commits`, { tree: createdTree.sha, parents: [ref.object.sha],
    message: 'Prepare Happ Toggle 1.12.0 preview\n\nCo-Authored-By: Claude <noreply@anthropic.com>' });
  await api('PATCH', `${prefix}/git/refs/heads/${encodeURIComponent(branch)}`, { sha: commit.sha, force: false });
  await api('PUT', `${prefix}/topics`, { names: ['streamdeck', 'stream-deck-plugin', 'happ', 'vpn', 'windows', 'speedtest', 'stream-deck-plus', 'stream-deck-neo'] });
  const release = await api('POST', `${prefix}/releases`, { tag_name: 'v1.12.0', target_commitish: commit.sha,
    name: 'Happ Toggle 1.12.0 — preview', prerelease: true, draft: false,
    body: fs.readFileSync(path.join(source, 'RELEASE_NOTES.md'), 'utf8') });
  const upload = release.upload_url.split('{')[0];
  if (new URL(upload).hostname !== 'uploads.github.com') throw new Error('Unexpected release upload host.');
  for (const asset of assets) {
    const file = path.join(root, asset);
    const response = await fetch(upload + '?name=' + encodeURIComponent(path.basename(file)), { method: 'POST', redirect: 'error',
      headers: { ...headers, 'Content-Type': 'application/octet-stream' }, body: fs.readFileSync(file) });
    if (!response.ok) throw new Error(`Release asset upload failed: HTTP ${response.status}`);
  }
  const verified = await api('GET', `${prefix}/releases/${release.id}`);
  if (verified.assets.length !== assets.length) throw new Error('Release asset count differs from the prepared set.');
  console.log('Source commit:', commit.sha);
  console.log('Preview release:', release.html_url);
  console.log('Verified release assets:', verified.assets.length);
})().catch((error) => {
  const safe = String(error.message).replace(/gh[pousr]_[A-Za-z0-9]+/g, '[redacted]');
  console.error(safe);
  console.error('No success claimed. If creation had already begun, inspect the repository before retrying.');
  process.exitCode = 1;
});
