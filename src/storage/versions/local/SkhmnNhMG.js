import browser from 'webextension-polyfill';

const message = 'Add installTime, searchCount and contribPageLastOpen';

const revision = 'SkhmnNhMG';
const downRevision = 'SJltHx2rW';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {};
  changes.installTime = new Date().getTime();
  changes.searchCount = 0;
  changes.contribPageLastOpen = 0;

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};
  await storage.remove(['installTime', 'searchCount', 'contribPageLastOpen']);

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

module.exports = {
  message,
  revision,
  upgrade,
  downgrade
};
