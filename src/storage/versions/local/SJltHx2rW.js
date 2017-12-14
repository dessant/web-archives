import browser from 'webextension-polyfill';

const message = 'Initial version';

const revision = 'SJltHx2rW';
const downRevision = null;

const storage = browser.storage.local;

async function upgrade() {
  const changes = {
    engines: [
      'archiveOrg',
      'google',
      'googleText',
      'bing',
      'yandex',
      'archiveIs',
      'memento',
      'webcite',
      'exalead',
      'gigablast',
      'sogou',
      'qihoo',
      'baidu',
      'naver',
      'yahooJp',
      'megalodon'
    ],
    disabledEngines: [
      'googleText',
      'memento',
      'webcite',
      'exalead',
      'gigablast',
      'qihoo',
      'baidu',
      'naver',
      'yahooJp',
      'megalodon'
    ],
    showInContextMenu: 'link', // 'all', 'link', 'false'
    searchAllEnginesContextMenu: 'sub', // 'main', 'sub', 'false'
    searchAllEnginesAction: 'sub', // 'main', 'sub', 'false'
    showPageAction: true,
    openNewTab: true,
    tabInBackgound: false
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  return storage.clear();
}

module.exports = {
  message,
  revision,
  upgrade,
  downgrade
};
