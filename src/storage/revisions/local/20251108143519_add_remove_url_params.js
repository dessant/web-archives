const message = 'Add removeUrlParams';

const revision = '20251108143519_add_remove_url_params';

async function upgrade() {
  const changes = {};

  changes.removeUrlParams = false;

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};

