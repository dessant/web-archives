const message = 'Add showEngineIcons';

const revision = '20220102035029_add_showengineicons';

async function upgrade() {
  const changes = {};

  changes.showEngineIcons = true;

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
