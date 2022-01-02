import browser from 'webextension-polyfill';

const message = 'Add archiveOrgAll and archiveIsAll';

const revision = 'yjRtkzy';
const downRevision = 'rJXbW1ZHmM';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {};

  const {engines, disabledEngines} = await storage.get([
    'engines',
    'disabledEngines'
  ]);

  engines.splice(engines.indexOf('archiveOrg') + 1, 0, 'archiveOrgAll');
  engines.splice(engines.indexOf('archiveIs') + 1, 0, 'archiveIsAll');
  changes.engines = engines;
  changes.disabledEngines = disabledEngines.concat([
    'archiveOrgAll',
    'archiveIsAll'
  ]);

  changes.storageVersion = revision;
  return storage.set(changes);
}

export {message, revision, upgrade};
