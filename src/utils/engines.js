import {waitForDocumentLoad} from 'utils/common';

function showEngineError({message, errorId, engine}) {
  if (!message) {
    message = browser.i18n.getMessage(
      errorId,
      browser.i18n.getMessage(`engineName_${engine}`)
    );
  }
  browser.runtime.sendMessage({
    id: 'notification',
    message,
    type: `${engine}Error`
  });
}

async function sendReceipt(storageIds) {
  if (storageIds.length) {
    const keys = [...storageIds];
    while (storageIds.length) {
      storageIds.pop();
    }

    await browser.runtime.sendMessage({
      id: 'storageReceipt',
      storageIds: keys
    });
  }
}

async function initSearch(searchFn, engine, taskId) {
  await waitForDocumentLoad();

  const task = await browser.runtime.sendMessage({
    id: 'storageRequest',
    asyncResponse: true,
    storageId: taskId
  });

  if (task) {
    const storageIds = [taskId, task.docId];

    try {
      const doc = await browser.runtime.sendMessage({
        id: 'storageRequest',
        asyncResponse: true,
        storageId: task.docId
      });

      if (doc) {
        await searchFn({
          session: task.session,
          search: task.search,
          doc,
          storageIds
        });
      } else {
        await sendReceipt(storageIds);

        showEngineError({errorId: 'error_sessionExpiredEngine', engine});
      }
    } catch (err) {
      await sendReceipt(storageIds);

      showEngineError({errorId: 'error_engine', engine});

      console.log(err.toString());
      throw err;
    }
  } else {
    showEngineError({errorId: 'error_sessionExpiredEngine', engine});
  }
}

async function searchPermacc({session, search, doc} = {}) {
  const rsp = await fetch(
    `https://api.perma.cc/v1/public/archives/?format=json&limit=1&url=${encodeURIComponent(
      doc.docUrl
    )}`,
    {
      referrer: '',
      mode: 'cors',
      method: 'GET',
      credentials: 'omit'
    }
  );

  if (rsp.status !== 200) {
    throw new Error(`API response: ${rsp.status}, ${await rsp.text()}`);
  }

  const response = await rsp.json();

  const result = response.objects[0];
  if (result) {
    const tabUrl = `https://perma.cc/${result.guid}`;

    return tabUrl;
  }
}

export {showEngineError, sendReceipt, initSearch, searchPermacc};
