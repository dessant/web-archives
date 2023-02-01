import {v4 as uuidv4} from 'uuid';

import {findNode} from 'utils/common';
import {initSearch, sendReceipt} from 'utils/engines';
import {targetEnv} from 'utils/config';

const engine = 'yandex';

async function search({session, search, doc, storageIds}) {
  if (!window.location.pathname.startsWith('/search')) {
    const input = await findNode('input#text');

    input.value = doc.docUrl;
    input.dispatchEvent(new InputEvent('input', {bubbles: true}));

    (await findNode('.search2__button button')).click();

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

    function serviceObserver(eventName) {
      let stop;

      const checkService = function () {
        if (window.Ya?.reactBus?.e['extralinks-popup:open']?.length >= 2) {
          window.clearTimeout(timeoutId);
          document.dispatchEvent(new Event(eventName));
        } else if (!stop) {
          window.setTimeout(checkService, 200);
        }
      };

      const timeoutId = window.setTimeout(function () {
        stop = true;
      }, 60000); // 1 minute

      checkService();
    }

    const script = document.createElement('script');
    if (['firefox', 'safari'].includes(targetEnv)) {
      const nonceNode = document.querySelector('script[nonce]');
      if (nonceNode) {
        script.nonce = nonceNode.nonce;
      }
    }
    script.textContent = `(${serviceObserver.toString()})("${eventName}")`;
    document.documentElement.appendChild(script);
    script.remove();
  });

  if (results) {
    const nodes = document.querySelectorAll(
      '#search-result .serp-item button.Organic-Extralinks'
    );

    await sendReceipt(storageIds);

    for (const node of nodes) {
      const data = JSON.parse(node.dataset.vnl);
      const hasCacheUrl = data.items.some(item => item.variant === 'copy');

      if (hasCacheUrl) {
        node.click();

        window.setTimeout(function () {
          const link = document.querySelector(
            '.extralinks-popup a.Extralinks-Item_copy'
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
  if (!window.location.pathname.startsWith('/showcaptcha')) {
    initSearch(search, engine, taskId);
  }
}

init();
