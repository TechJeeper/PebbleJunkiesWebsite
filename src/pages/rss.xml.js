import news from '../data/news.json';

export const prerender = true;

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(dateOnly) {
  return new Date(`${dateOnly}T12:00:00.000Z`).toUTCString();
}

export function GET() {
  const site = 'https://pebblejunkies.com';
  const buildDate = new Date().toUTCString();

  const items = news
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.href)}</link>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
      <pubDate>${toRfc822(item.date)}</pubDate>
      <category>${escapeXml(item.source)}</category>
      <description>${escapeXml(item.blurb)}</description>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pebble Junkies · News Pulse</title>
    <link>${site}/news</link>
    <description>Curated + automated Pebble news from Eric Migicovsky, rePebble, and Rebble.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
