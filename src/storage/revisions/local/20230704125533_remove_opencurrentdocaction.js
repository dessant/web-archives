const message = 'Remove openCurrentDocAction';

const revision = '20230704125533_remove_opencurrentdocaction';

async function upgrade() {
  const changes = {};

  await browser.storage.local.remove('openCurrentDocAction');

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
