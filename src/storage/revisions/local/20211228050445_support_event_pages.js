import browser from 'webextension-polyfill';

const message = 'Support event pages';

const revision = '20211228050445_support_event_pages';
const downRevision = 'yjRtkzy';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {};

  const {engines, disabledEngines, searchCount} = await storage.get([
    'engines',
    'disabledEngines',
    'searchCount'
  ]);
  const removeEngines = ['sogou', 'naver', 'exalead', 'webcite'];

  changes.engines = engines.filter(function (item) {
    return !removeEngines.includes(item);
  });
  changes.disabledEngines = disabledEngines.filter(function (item) {
    return !removeEngines.includes(item);
  });

  changes.taskRegistry = {lastTaskStart: 0, tabs: {}, tasks: {}};
  changes.storageRegistry = {};
  changes.lastStorageCleanup = 0;

  changes.lastEngineAccessCheck = 0;

  changes.setContextMenuEvent = 0;

  changes.searchModeContextMenu = 'tab'; // 'tab'
  changes.searchModeAction = 'tab'; // 'tab', 'url'

  changes.useCount = searchCount;

  await storage.remove(['searchCount', 'openNewTab']);

  changes.storageVersion = revision;
  return storage.set(changes);
}

export {message, revision, upgrade};
