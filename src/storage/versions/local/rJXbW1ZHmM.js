import browser from 'webextension-polyfill';

const message = 'Set showPageAction to false';

const revision = 'rJXbW1ZHmM';
const downRevision = 'SkhmnNhMG';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {};
  changes.showPageAction = false;

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
