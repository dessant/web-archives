const message = 'Remove Gigablast';

const revision = '20230703074609_remove_gigablast';

async function upgrade() {
  const changes = {};
  const {engines, disabledEngines} = await browser.storage.local.get([
    'engines',
    'disabledEngines'
  ]);

  const removeEngines = ['gigablast'];

  changes.engines = engines.filter(function (item) {
    return !removeEngines.includes(item);
  });
  changes.disabledEngines = disabledEngines.filter(function (item) {
    return !removeEngines.includes(item);
  });

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
