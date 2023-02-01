const message = 'Add openCurrentDoc';

const revision = '20220114113759_add_opencurrentdoc';

async function upgrade() {
  const changes = {
    openCurrentDocAction: true,
    openCurrentDocContextMenu: true
  };

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
