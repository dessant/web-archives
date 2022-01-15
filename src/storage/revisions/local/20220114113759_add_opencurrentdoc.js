import browser from 'webextension-polyfill';

const message = 'Add openCurrentDoc';

const revision = '20220114113759_add_opencurrentdoc';
const downRevision = '20220102051642_add_search_engines';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {
    openCurrentDocAction: true,
    openCurrentDocContextMenu: true
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

export {message, revision, upgrade};
