import {validateUrl} from 'utils/app';
import {findNode, runOnce} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'ghostarchive';

async function search({session, search, doc, storageIds} = {}) {
  const link = await findNode('#bodyContent table td a', {
    throwError: false,
    timeout: 10000
  });

  await sendReceipt(storageIds);

  if (link) {
    const tabUrl = link.href;

    if (validateUrl(tabUrl)) {
      window.location.href = tabUrl;
    }
  }
}

function init() {
  initSearch(search, engine, taskId);
}

if (runOnce('search')) {
  init();
}
