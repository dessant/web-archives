import {validateUrl} from 'utils/app';
import {findNode} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'gigablast';

async function search({session, search, doc, storageIds}) {
  await findNode('#numfound', {throwError: false});

  let tabUrl;
  const cacheUrls = [];
  const rxUrl = /^(?:https?|ftp):\/\/(?:www.)?(.*)$/i;

  const noschUrl = doc.docUrl.replace(rxUrl, '$1');

  const results = document.evaluate(
    '//table[@class="result"]/tbody/tr/td//a[text()="cached"]',
    document,
    null,
    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
    null
  );

  const nodes = [];
  let node;
  while ((node = results.iterateNext())) {
    nodes.push(node);
  }

  for (const node of nodes) {
    const cacheUrl = node.href;
    const cacheParam = node.parentNode?.parentNode?.querySelector(
      'a.title, a.kidtitle'
    )?.href;

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
  // skip Cloudflare pages
  if (
    !document.body.querySelector('form#challenge-form') ||
    !document.head.querySelector('meta[name="captcha-bypass"]')
  ) {
    initSearch(search, engine, taskId);
  }
}

init();
