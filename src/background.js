// Registers the compose-window script that watches for a shortcut such as ;sig. No network access.
(async () => {
  try {
    const have = await messenger.scripting.compose.getRegisteredScripts({ ids: ['snippets-compose'] });
    if (!have.length) {
      await messenger.scripting.compose.registerScripts([{ id: 'snippets-compose', js: ['lib.js', 'compose.js'], runAt: 'document_idle' }]);
    }
  } catch (e) { console.error('Quick Snippets: could not register compose script', e); }
})();
