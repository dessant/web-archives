import browser from 'webextension-polyfill';

const message = 'Add search engines';

const revision = '20220102051642_add_search_engines';
const downRevision = '20220102035029_add_showengineicons';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {};
  const {engines, disabledEngines} = await storage.get([
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
  return storage.set(changes);
}

export {message, revision, upgrade};
