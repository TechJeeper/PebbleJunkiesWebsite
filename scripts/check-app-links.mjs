import fs from 'fs';

const apps = JSON.parse(fs.readFileSync('src/data/apps.json', 'utf8'));
const all = [...apps.watchapps, ...apps.watchfaces];

async function check(app) {
  const url = app.href || `https://apps.rebble.io/application/${app.id}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    const ok =
      res.ok &&
      (text.includes(app.title) || text.includes(app.id) || text.length > 100000);
    return { title: app.title, url, status: res.status, ok };
  } catch (e) {
    return { title: app.title, url, status: 0, ok: false, error: String(e) };
  }
}

const results = [];
for (const app of all) {
  const r = await check(app);
  results.push(r);
  console.log(`${r.ok ? 'OK' : 'FAIL'} ${r.status} ${r.title}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} ok`);
if (failed.length) {
  failed.forEach((f) => console.log(` - ${f.title}: ${f.status} ${f.url}`));
  process.exitCode = 1;
}
