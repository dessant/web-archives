const message = 'Add archive host options';

const revision = '20251205101919_add_archive_host_options';

async function upgrade() {
  const changes = {};

  changes.archiveOrgHost = 'web_archive_org';
  changes.archiveIsHost = 'archive_is';

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
