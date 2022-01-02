import {findNode} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'qihoo';

async function search({session, search, doc, storageIds}) {
  await findNode('li.res-list p.g-linkinfo > a.m', {throwError: false});

  const cacheNodes = [];
  const rxUrl = /^(?:https?|ftp):\/\/(?:www.)?(.*)$/i;

  const noschUrl = doc.docUrl.replace(rxUrl, '$1');

  const nodes = document.querySelectorAll('li.res-list p.g-linkinfo > a.m');

  await sendReceipt(storageIds);

  for (const node of nodes) {
    const cacheParam = new URL(node.href).searchParams.get('u');

    if (cacheParam) {
      const noschCacheParam = cacheParam.replace(rxUrl, '$1');
      if (noschCacheParam === noschUrl) {
        node.setAttribute('target', '_top');
        node.click();

        return;
      }
      if (noschCacheParam.startsWith(noschUrl)) {
        cacheNodes.push(node);
      }
    }
  }

  if (cacheNodes.length) {
    const node = cacheNodes[0];
    node.setAttribute('target', '_top');
    node.click();
  }
}

function init() {
  initSearch(search, engine, taskId);
}

init();
