const message = 'Remove Memento Time Travel';

const revision = '20260215113435_remove_memento_time_travel';

async function upgrade() {
  const changes = {};
  const {engines, disabledEngines} = await browser.storage.local.get([
    'engines',
    'disabledEngines'
  ]);

  const removeEngines = ['memento'];
  const enableEngines = ['softwareHeritage'];

  changes.engines = engines.filter(function (item) {
    return !removeEngines.includes(item);
  });
  changes.disabledEngines = disabledEngines.filter(function (item) {
    return !removeEngines.includes(item) && !enableEngines.includes(item);
  });

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
