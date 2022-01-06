import {validateUrl} from 'utils/app';
import {findNode} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'yahoo';

async function search({session, search, doc, storageIds}) {
  const button = await findNode(
    '#results li:first-of-type div.options-toggle span.chevron-down',
    {throwError: false}
  );

  if (button) {
    button.click();

    const node = await findNode(
      '#results li:first-of-type a[href*="cc.bingj.com/cache"], #results li:first-of-type a[href*="cc.bingj.com%2fcache"]',
      {throwError: false, timeout: 1000}
    );

    await sendReceipt(storageIds);

    if (node) {
      const tabUrl = node.href;

      if (validateUrl(tabUrl)) {
        window.location.href = tabUrl;
      }
    }
  } else {
    await sendReceipt(storageIds);
  }
}

function init() {
  if (!window.location.hostname.startsWith('consent.')) {
    initSearch(search, engine, taskId);
  }
}

init();
