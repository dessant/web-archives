const message = 'Remove search engines';

const revision = '20240928183956_remove_search_engines';

async function upgrade(context) {
  const changes = {};
  const {engines, disabledEngines} = await browser.storage.local.get([
    'engines',
    'disabledEngines'
  ]);

  const removeEngines = ['google', 'googleText', 'yahoo'];
  const enableEngines = [];

  if (context.install) {
    enableEngines.push('ghostarchive', 'webcite');
  }

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
