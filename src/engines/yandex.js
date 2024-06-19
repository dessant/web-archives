import {v4 as uuidv4} from 'uuid';

import {
  findNode,
  makeDocumentVisible,
  executeScriptMainContext,
  runOnce,
  sleep
} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';

const engine = 'yandex';

async function search({session, search, doc, storageIds}) {
  if (!window.location.pathname.startsWith('/search')) {
    const input = await findNode('input#text');

    input.value = doc.docUrl;
    input.dispatchEvent(new InputEvent('input', {bubbles: true}));

    (await findNode('button.search3__button')).click();

    return;
  }

  const results = await findNode('#search-result', {throwError: false});

  // wait for search service to load
  await new Promise((resolve, reject) => {
    const eventName = uuidv4();

    const onServiceReady = function () {
      window.clearTimeout(timeoutId);
      resolve();
    };

    const timeoutId = window.setTimeout(function () {
      document.removeEventListener(eventName, onServiceReady, {
        capture: true,
        once: true
      });

      reject(new Error('Search service is not ready'));
    }, 60000); // 1 minute

    document.addEventListener(eventName, onServiceReady, {
      capture: true,
      once: true
    });

    executeScriptMainContext({
      func: 'yandexServiceObserver',
      args: [eventName]
    });
  });
  await sleep(1000);

  if (results) {
    const nodes = document.querySelectorAll(
      '#search-result .serp-item button.OrganicExtralinks'
    );

    await sendReceipt(storageIds);

    for (const node of nodes) {
      const data = JSON.parse(node.dataset.vnl);
      const hasCacheUrl = data.items.some(item => item.variant === 'copy');

      if (hasCacheUrl) {
        node.click();

        window.setTimeout(function () {
          const link = document.querySelector(
            '#ExtralinksPopup a.ExtralinksPopup-Item_copy'
          );
          link.setAttribute('target', '_top');
          link.click();
        }, 100);

        break;
      }
    }
  } else {
    await sendReceipt(storageIds);
  }
}

function init() {
  makeDocumentVisible();
  if (!window.location.pathname.startsWith('/showcaptcha')) {
    initSearch(search, engine, taskId);
  }
}

if (runOnce('search')) {
  init();
}
