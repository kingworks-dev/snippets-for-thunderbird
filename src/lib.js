// Shared logic for Quick Snippets for Thunderbird. No network access anywhere in this extension.
const FREE_LIMIT = 10;
const api = typeof messenger !== 'undefined' ? messenger : browser;
async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}
// Honor-system key: SNIP-XXXX-XXXX-CCCC where CCCC is a checksum of the first two groups.
async function validKey(k) {
  const m = /^SNIP-([0-9A-F]{4})-([0-9A-F]{4})-([0-9A-F]{4})$/.exec((k || '').trim().toUpperCase());
  if (!m) return false;
  return (await sha('SNIP' + m[1] + m[2] + 'KAI')).slice(0, 4) === m[3];
}
async function load() {
  const d = await api.storage.local.get(['snippets', 'proKey', 'myName']);
  return { snippets: d.snippets || [], pro: !!d.proKey && await validKey(d.proKey), myName: d.myName || '' };
}
function expandVars(text, ctx) {
  if (!ctx.pro) return text;
  const now = new Date();
  return text.replace(/\{name\}/gi, ctx.myName || '{name}')
    .replace(/\{date\}/gi, now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }))
    .replace(/\{time\}/gi, now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
}
