import {v4 as uuidv4} from 'uuid';

import {
  findNode,
  makeDocumentVisible,
  executeScriptMainContext,
  runOnce,
  sleep
} from 'utils/common';
import {initSearch, sendReceipt, getRankedResults} from 'utils/engines';

const engine = 'yandex';

async function handleResults(sourceUrl, results) {
  const items = [];

  for (const button of results) {
    const data = Object.keys(button.dataset)
      .map(item => {
        return button.dataset[item];
      })
      .find(item => item.match(/^{.*variant/g));

    const cacheData = JSON.parse(data.replace(/(&quot\;)/g, '"')).items.find(
      item => item.variant === 'copy'
    );

    if (cacheData) {
      items.push({
        button,
        url: new URL(cacheData.url).searchParams.get('url')
      });
    }
  }

  const rankedResults = getRankedResults({sourceUrl, results: items});

  if (rankedResults.length) {
    rankedResults[0].button.click();

    window.setTimeout(async function () {
      const link = await findNode(
        '#ExtralinksPopup a.ExtralinksPopup-Item_copy'
      );
      link.setAttribute('target', '_top');
      link.click();
    }, 100);
  }
}

async function search({session, search, doc, storageIds}) {
  if (!window.location.pathname.startsWith('/search')) {
    const input = await findNode('input#text');

    input.value = `url:${doc.docUrl}`;
    input.dispatchEvent(new InputEvent('input', {bubbles: true}));

    (await findNode('button.search3__button')).click();

    return;
  }

  await findNode('#search-result', {throwError: false});

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

  let results = document.querySelectorAll(
    '#search-result button.OrganicExtralinks'
  );

  if (results.length) {
    await sendReceipt(storageIds);

    await handleResults(doc.docUrl, results);
  } else {
    const input = await findNode(
      'form[role=search] .HeaderForm-InputWrapper input.HeaderForm-Input'
    );

    if (input.value.startsWith('url:')) {
      input.click();

      input.value = doc.docUrl;
      input.dispatchEvent(new InputEvent('input', {bubbles: true}));

      window.setTimeout(async function () {
        (await findNode('form[role=search] button.HeaderForm-Submit')).click();
      }, 100);

      // the page is not reloaded on desktop
      await findNode('#search-result button.OrganicExtralinks', {
        throwError: false,
        timeout: 30000
      });
      await sleep(1000);

      await sendReceipt(storageIds);

      results = document.querySelectorAll(
        '#search-result button.OrganicExtralinks'
      );

      if (results.length) {
        await handleResults(doc.docUrl, results);
      }
    }
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
