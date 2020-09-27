import browser from 'webextension-polyfill';

const message = 'Add archiveOrgAll and archiveIsAll';

const revision = 'yjRtkzy';
const downRevision = 'rJXbW1ZHmM';

const storage = browser.storage.sync;

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

async function downgrade() {
  const changes = {};
  const {engines, disabledEngines} = await storage.get([
    'engines',
    'disabledEngines'
  ]);
  const newEngines = ['archiveOrgAll', 'archiveIsAll'];

  changes.engines = engines.filter(function (item) {
    return !newEngines.includes(item);
  });
  changes.disabledEngines = disabledEngines.filter(function (item) {
    return !newEngines.includes(item);
  });

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
