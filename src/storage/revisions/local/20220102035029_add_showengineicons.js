import browser from 'webextension-polyfill';

const message = 'Add showEngineIcons';

const revision = '20220102035029_add_showengineicons';
const downRevision = '20211228050445_support_event_pages';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {};

  changes.showEngineIcons = true;

  changes.storageVersion = revision;
  return storage.set(changes);
}

export {message, revision, upgrade};
