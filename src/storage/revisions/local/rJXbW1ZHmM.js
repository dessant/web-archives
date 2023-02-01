const message = 'Set showPageAction to false';

const revision = 'rJXbW1ZHmM';

async function upgrade() {
  const changes = {};
  changes.showPageAction = false;

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
