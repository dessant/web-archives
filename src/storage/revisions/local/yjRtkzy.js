const message = 'Add archiveOrgAll and archiveIsAll';

const revision = 'yjRtkzy';

async function upgrade() {
  const changes = {};

  const {engines, disabledEngines} = await browser.storage.local.get([
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
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
