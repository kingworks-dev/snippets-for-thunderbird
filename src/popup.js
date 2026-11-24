const $ = id => document.getElementById(id);
const PRO_URL = 'https://buy.stripe.com/6oUeV6bTNb4E5Zw86D0x40Z';
$('buy').href = PRO_URL;
$('buy').onclick = e => { e.preventDefault(); api.windows.openDefaultBrowser(PRO_URL); };
function msg(t, err) { $('msg').textContent = t; $('msg').className = err ? 'err' : ''; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
async function render() {
  const { snippets, pro, myName } = await load();
  $('plan').textContent = pro ? 'Pro' : 'Free'; $('plan').className = 'badge' + (pro ? ' pro' : '');
  $('myName').value = myName;
  const list = $('list'); list.replaceChildren();
  if (!snippets.length) { const li = document.createElement('li'); li.className = 'm'; li.textContent = 'No snippets yet.'; list.append(li); return; }
  snippets.forEach((s, i) => {
    const li = document.createElement('li'); li.dataset.i = i;
    const t = document.createElement('div'); t.className = 't'; t.textContent = ';' + s.shortcut;
    const m = document.createElement('div'); m.className = 'm'; m.textContent = s.text;
    li.append(t, m);
    for (const [a, label] of [['insert', 'Insert'], ['edit', 'Edit'], ['del', 'Delete']]) {
      const b = document.createElement('button'); b.dataset.a = a; b.textContent = label; li.append(b);
    }
    list.append(li);
  });
}
$('save').onclick = async () => {
  const shortcut = $('short').value.trim().replace(/^;/, ''), text = $('text').value;
  if (!/^[A-Za-z0-9_-]+$/.test(shortcut) || !text) return msg('Enter a shortcut (letters, numbers, - _) and some text.', 1);
  const { snippets, pro } = await load();
  const i = snippets.findIndex(s => s.shortcut.toLowerCase() === shortcut.toLowerCase());
  if (i < 0 && !pro && snippets.length >= FREE_LIMIT) return msg('Free limit of ' + FREE_LIMIT + ' snippets reached. Unlock Pro for unlimited.', 1);
  if (i >= 0) snippets[i] = { shortcut, text }; else snippets.push({ shortcut, text });
  await api.storage.local.set({ snippets }); $('short').value = ''; $('text').value = ''; msg('Saved ;' + shortcut); render();
};
$('list').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return; const i = +b.closest('li').dataset.i;
  const { snippets, pro, myName } = await load(); const s = snippets[i];
  if (b.dataset.a === 'del') { snippets.splice(i, 1); await api.storage.local.set({ snippets }); msg('Deleted'); }
  if (b.dataset.a === 'edit') { $('short').value = s.shortcut; $('text').value = s.text; }
  if (b.dataset.a === 'insert') {
    const text = expandVars(s.text, { pro, myName });
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    try { await api.tabs.sendMessage(tab.id, { type: 'insert', text }); msg('Inserted'); }
    catch (err) {
      // Fallback when the editor script is not running: append to the message body.
      try {
        const d = await api.compose.getComposeDetails(tab.id);
        if (d.isPlainText) await api.compose.setComposeDetails(tab.id, { plainTextBody: (d.plainTextBody || '') + '\n' + text });
        else await api.compose.setComposeDetails(tab.id, { body: (d.body || '').replace(/<\/body>/i, '<div>' + esc(text).replace(/\n/g, '<br>') + '</div></body>') });
        msg('Added to the end of the message');
      } catch (err2) { msg('Open a message you are writing first.', 1); }
    }
  }
  render();
};
$('activate').onclick = async () => {
  const k = $('key').value.trim().toUpperCase();
  if (await validKey(k)) { await api.storage.local.set({ proKey: k }); msg('Pro unlocked. Thank you.'); } else msg('That key is not valid.', 1); render();
};
$('saveName').onclick = async () => { await api.storage.local.set({ myName: $('myName').value.trim() }); msg('Name saved'); };
render();
