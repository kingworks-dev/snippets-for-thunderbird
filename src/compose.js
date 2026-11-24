// Runs inside Thunderbird's message editor. Expands ;shortcut on Space/Tab and inserts snippets sent from the popup.
(() => {
  let cache = null;
  const refresh = async () => { cache = await load(); };
  refresh();
  api.storage.onChanged.addListener(refresh);

  function triggerBefore() {
    const sel = getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return null;
    const n = sel.anchorNode;
    if (!n || n.nodeType !== 3) return null;
    const before = n.textContent.slice(0, sel.anchorOffset);
    const m = /(?:^|\s);([A-Za-z0-9_-]+)$/.exec(before);
    if (!m) return null;
    return { name: m[1], select: () => {
      const r = document.createRange();
      r.setStart(n, sel.anchorOffset - m[1].length - 1); r.setEnd(n, sel.anchorOffset);
      sel.removeAllRanges(); sel.addRange(r);
    } };
  }
  function insertText(text) { document.execCommand('insertText', false, text); }

  document.addEventListener('keydown', e => {
    if (!cache || (e.key !== ' ' && e.key !== 'Tab') || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = triggerBefore(); if (!t) return;
    const list = cache.pro ? cache.snippets : cache.snippets.slice(0, FREE_LIMIT);
    const s = list.find(x => x.shortcut.toLowerCase() === t.name.toLowerCase()); if (!s) return;
    e.preventDefault(); e.stopPropagation();
    t.select();
    insertText(expandVars(s.text, cache));
  }, true);

  api.runtime.onMessage.addListener(msg => {
    if (msg && msg.type === 'insert') { document.body.focus(); insertText(msg.text); return Promise.resolve(true); }
  });
})();
