import {validateUrl} from 'utils/app';
import {findNode} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'yahooJp';

async function search({session, search, doc, storageIds}) {
  await findNode('button.sw-Card__titlePullDown', {throwError: false});

  let tabUrl;
  const cacheUrls = [];
  const rxUrl = /^(?:https?|ftp):\/\/(?:www.)?(.*)$/i;

  const noschUrl = doc.docUrl.replace(rxUrl, '$1');

  const nodes = document.querySelectorAll('button.sw-Card__titlePullDown');

  for (const node of nodes) {
    node.click();

    const cacheLink = await findNode(
      'button.sw-Card__titlePullDown a.Algo__cache',
      {rootNode: node, throwError: false, timeout: 100}
    );

    const cacheUrl = cacheLink.href;
    const cacheParam = new URL(cacheUrl).searchParams.get('u');

    if (cacheParam) {
      const noschCacheParam = cacheParam.replace(rxUrl, '$1');
      if (noschCacheParam === noschUrl) {
        tabUrl = cacheUrl;

        break;
      }
      if (noschCacheParam.startsWith(noschUrl)) {
        cacheUrls.push(cacheUrl);
      }
    }
  }

  await sendReceipt(storageIds);

  if (!tabUrl && cacheUrls.length) {
    tabUrl = cacheUrls[0];
  }

  if (validateUrl(tabUrl)) {
    window.location.href = tabUrl;
  }
}

function init() {
  initSearch(search, engine, taskId);
}

init();
