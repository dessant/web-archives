import {validateUrl} from 'utils/app';
import {findNode} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'mailru';

async function search({session, search, doc, storageIds}) {
  await findNode('#js-result_1', {throwError: false});

  let tabUrl;
  const cacheUrls = [];
  const rxUrl = /^(?:https?|ftp):\/\/(?:www.)?(.*)$/i;

  const noschUrl = doc.docUrl.replace(rxUrl, '$1');

  const nodes = document.querySelectorAll(
    '#js-result .SnippetResultInfo-iconDown button'
  );

  for (const node of nodes) {
    node.click();

    const cacheLink = await findNode('a.SnippetResultInfo-savedUrl', {
      rootNode: node.parentNode,
      throwError: false,
      timeout: 100
    });

    if (cacheLink) {
      const cacheUrl = cacheLink.href;
      const cacheParam = new URL(cacheUrl).searchParams.get('qurl');

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
  if (!document.querySelector('.DesktopCaptcha-text')) {
    initSearch(search, engine, taskId);
  }
}

init();
