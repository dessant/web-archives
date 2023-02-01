const message = 'Add search engines';

const revision = '20220102051642_add_search_engines';

async function upgrade() {
  const changes = {};
  const {engines, disabledEngines} = await browser.storage.local.get([
    'engines',
    'disabledEngines'
  ]);

  const removeEngines = ['baidu', 'qihoo'];

  changes.engines = engines.filter(function (item) {
    return !removeEngines.includes(item);
  });
  changes.disabledEngines = disabledEngines.filter(function (item) {
    return !removeEngines.includes(item);
  });

  const newEngines = ['baidu', 'yahoo', 'qihoo', 'mailru'];

  changes.engines = changes.engines.concat(newEngines);
  changes.disabledEngines.push('mailru');

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
