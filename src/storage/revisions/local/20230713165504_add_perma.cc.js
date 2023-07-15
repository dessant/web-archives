const message = 'Add Perma.cc';

const revision = '20230713165504_add_perma.cc';

async function upgrade() {
  const changes = {};
  const {engines} = await browser.storage.local.get('engines');

  engines.splice(engines.indexOf('megalodon'), 0, 'permacc');
  changes.engines = engines;

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
