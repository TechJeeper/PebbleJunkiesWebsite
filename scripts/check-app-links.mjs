import fs from 'fs';

const apps = JSON.parse(fs.readFileSync('src/data/apps.json', 'utf8'));
const all = [...apps.watchapps, ...apps.watchfaces];

async function check(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { url, status: res.status, ok: res.ok };
  } catch (e) {
    return { url, status: 0, ok: false, error: String(e) };
  }
}

const results = [];
for (const app of all) {
  const url = `https://apps.repebble.com/${app.id}`;
  const r = await check(url);
  results.push({ title: app.title, id: app.id, ...r });
  process.stdout.write(`${r.ok ? 'OK' : 'FAIL'} ${r.status} ${app.title}\n`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} ok`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(` - ${f.title}: ${f.status} ${f.url}`));
  process.exitCode = 1;
}
