import {findNode, runOnce} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'megalodon';

async function search({session, search, doc, storageIds}) {
  const node = await findNode('div#bgcontain a[id^="fish"]', {
    throwError: false
  });

  await sendReceipt(storageIds);

  if (node) {
    node.setAttribute('target', '_top');
    node.click();
  }
}

function init() {
  initSearch(search, engine, taskId);
}

if (runOnce('search')) {
  init();
}
