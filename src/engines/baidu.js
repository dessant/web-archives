import {findNode} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'baidu';

async function search({session, search, doc, storageIds}) {
  const node = await findNode(
    'div#content_left > div.result[id="1"] div.f13 > a.m',
    {throwError: false}
  );

  await sendReceipt(storageIds);

  if (node) {
    node.setAttribute('target', '_top');
    node.click();
  }
}

function init() {
  initSearch(search, engine, taskId);
}

init();
