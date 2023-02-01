const message = 'Add installTime, searchCount and contribPageLastOpen';

const revision = 'SkhmnNhMG';

async function upgrade() {
  const changes = {};
  changes.installTime = new Date().getTime();
  changes.searchCount = 0;
  changes.contribPageLastOpen = 0;

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
