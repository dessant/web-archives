const message = 'Remove Bing';

const revision = '20241213110403_remove_bing';

async function upgrade() {
  const changes = {};
  const {engines, disabledEngines} = await browser.storage.local.get([
    'engines',
    'disabledEngines'
  ]);

  const removeEngines = ['bing'];
  const enableEngines = ['memento'];

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
