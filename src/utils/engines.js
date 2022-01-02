import browser from 'webextension-polyfill';

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
  // Script may be injected multiple times.
  if (typeof self.task === 'undefined') {
    self.task = null;
  } else {
    return;
  }

  self.task = await browser.runtime.sendMessage({
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

        showEngineError({errorId: 'error_sessionExpired', engine});
      }
    } catch (err) {
      await sendReceipt(storageIds);

      showEngineError({errorId: 'error_engine', engine});

      console.log(err.toString());
      throw err;
    }
  } else {
    showEngineError({errorId: 'error_sessionExpired', engine});
  }
}

export {showEngineError, sendReceipt, initSearch};
