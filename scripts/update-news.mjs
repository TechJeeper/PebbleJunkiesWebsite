#!/usr/bin/env node
/**
 * Pulls fresh Pebble news from Bluesky + blog RSS feeds into src/data/news.json.
 * Manual (non-auto) entries are preserved. Auto entries are refreshed/merged.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const NEWS_PATH = join(ROOT, 'src', 'data', 'news.json');
const MAX_ITEMS = 40;
const USER_AGENT = 'PebbleJunkiesNewsBot/1.0 (+https://pebblejunkies.com/rss.xml)';

const BLOG_FEEDS = [
  { url: 'https://repebble.com/blog/rss', source: 'rePebble Blog', tags: ['core', 'blog'] },
  { url: 'https://rebble.io/feed.xml', source: 'Rebble Blog', tags: ['rebble', 'blog'] },
  { url: 'https://rebble.io/atom.xml', source: 'Rebble Blog', tags: ['rebble', 'blog'] },
];

const BLUESKY_ACTOR = 'ericmigi.com';
const PEBBLE_HINT =
  /\b(pebble|repebble|rebble|watchface|pebbleos|time\s*2|round\s*2|index\s*01|core devices|sdk|firmware)\b/i;

function slugId(prefix, input) {
  const hash = createHash('sha1').update(input).digest('hex').slice(0, 10);
  return `${prefix}-${hash}`;
}

function toDateOnly(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function cleanText(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, max = 220) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*' },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

function parseFeedItems(xml) {
  const items = [];
  const chunks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];

  for (const chunk of chunks) {
    const title = cleanText((chunk.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const link =
      cleanText((chunk.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] || '') ||
      cleanText((chunk.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || '');
    const guid = cleanText((chunk.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i) || [])[1] || '') ||
      cleanText((chunk.match(/<id[^>]*>([\s\S]*?)<\/id>/i) || [])[1] || '');
    const dateRaw =
      (chunk.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] ||
      (chunk.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i) || [])[1] ||
      (chunk.match(/<published[^>]*>([\s\S]*?)<\/published>/i) || [])[1] ||
      '';
    const summary =
      cleanText((chunk.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || [])[1] || '') ||
      cleanText((chunk.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) || [])[1] || '') ||
      cleanText((chunk.match(/<content[^>]*>([\s\S]*?)<\/content>/i) || [])[1] || '');

    const date = toDateOnly(cleanText(dateRaw));
    if (!title || !link || !date) continue;

    items.push({
      title,
      href: link.trim(),
      guid: guid || link.trim(),
      date,
      blurb: truncate(summary || title),
    });
  }

  return items;
}

async function fetchBlogNews() {
  const out = [];
  for (const feed of BLOG_FEEDS) {
    try {
      const xml = await fetchText(feed.url);
      const items = parseFeedItems(xml);
      for (const item of items.slice(0, 15)) {
        out.push({
          id: slugId('blog', item.guid || item.href),
          date: item.date,
          source: feed.source,
          title: item.title,
          blurb: item.blurb,
          href: item.href,
          tags: [...feed.tags],
          auto: true,
        });
      }
      console.log(`✓ ${feed.source}: ${items.length} items from ${feed.url}`);
    } catch (err) {
      console.warn(`✗ skip ${feed.url}: ${err.message}`);
    }
  }
  return out;
}

async function fetchBlueskyNews() {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(BLUESKY_ACTOR)}&limit=40`;
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT, accept: 'application/json' } });
  if (!res.ok) throw new Error(`Bluesky ${res.status}`);
  const data = await res.json();
  const out = [];

  for (const row of data.feed || []) {
    const post = row.post;
    const record = post?.record;
    if (!record?.text || !post?.uri || !record?.createdAt) continue;
    if (record.reply) continue;

    const text = cleanText(record.text);
    if (!PEBBLE_HINT.test(text)) continue;

    const rkey = post.uri.split('/').pop();
    const href = `https://bsky.app/profile/${BLUESKY_ACTOR}/post/${rkey}`;
    const date = toDateOnly(record.createdAt);
    if (!date) continue;

    const title = truncate(text.split('\n')[0], 110);
    out.push({
      id: slugId('bsky', post.uri),
      date,
      source: 'Bluesky · Eric Migicovsky',
      title,
      blurb: truncate(text),
      href,
      tags: ['bluesky', 'core'],
      auto: true,
    });
  }

  console.log(`✓ Bluesky: ${out.length} pebble-related posts`);
  return out;
}

function mergeNews(existing, incoming) {
  const manual = existing.filter((item) => !item.auto);
  const byHref = new Map();

  for (const item of manual) {
    byHref.set(item.href, item);
  }

  for (const item of [...existing.filter((i) => i.auto), ...incoming]) {
    const prev = byHref.get(item.href);
    if (prev && !prev.auto) continue; // never overwrite curated
    if (!prev || item.auto) {
      byHref.set(item.href, {
        id: item.id || prev?.id || slugId('news', item.href),
        date: item.date,
        source: item.source,
        title: item.title,
        blurb: item.blurb,
        href: item.href,
        tags: item.tags || [],
        ...(item.auto ? { auto: true } : {}),
      });
    }
  }

  return [...byHref.values()]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, MAX_ITEMS);
}

async function main() {
  const existing = JSON.parse(readFileSync(NEWS_PATH, 'utf8'));
  const [blogs, bluesky] = await Promise.all([
    fetchBlogNews(),
    fetchBlueskyNews().catch((err) => {
      console.warn(`✗ Bluesky failed: ${err.message}`);
      return [];
    }),
  ]);

  const merged = mergeNews(existing, [...blogs, ...bluesky]);
  const next = `${JSON.stringify(merged, null, 2)}\n`;
  const prev = `${JSON.stringify(existing, null, 2)}\n`;

  if (next === prev) {
    console.log('No news changes.');
    process.exitCode = 0;
    return;
  }

  writeFileSync(NEWS_PATH, next, 'utf8');
  console.log(`Updated ${NEWS_PATH} → ${merged.length} items`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
