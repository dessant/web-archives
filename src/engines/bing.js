import {findNode} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'bing';

async function search({session, search, doc, storageIds}) {
  const button = await findNode(
    'ol#b_results li.b_algo:first-of-type div.b_attribution a.trgr_icon',
    {throwError: false}
  );

  if (button) {
    button.click();

    const node = await findNode(
      'ol#b_results li.b_algo:first-of-type div.b_attribution a[href*="cc.bingj.com/cache"]'
    );
    node.setAttribute('target', '_top');

    await sendReceipt(storageIds);

    node.click();
  } else {
    await sendReceipt(storageIds);
  }
}

function init() {
  initSearch(search, engine, taskId);
}

init();
