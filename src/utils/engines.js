import psl from 'psl';

import {waitForDocumentLoad, getCharCount} from 'utils/common';

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

function processResult(sourceUrl, resultUrl) {
  const source = new URL(sourceUrl);
  const result = new URL(resultUrl);

  const data = {
    sourceUrl,
    resultUrl,
    protocolMatch: source.protocol === result.protocol,
    hostMatch: source.hostname === result.hostname,
    hostWithoutCommonSubdomainsMatch: false,
    domainMatch: psl.get(source.hostname) === psl.get(result.hostname),
    pathMatch: source.pathname === result.pathname,
    sourceStartsWithResultPath: source.pathname.startsWith(result.pathname),
    resultStartsWithSourcePath: result.pathname.startsWith(source.pathname),
    sourcePathLength: getCharCount(source.pathname) - 1,
    resultPathLength: getCharCount(result.pathname) - 1,
    searchParamsMatch: source.search === result.search,
    sourceStartsWithResultSearchParams: source.search.startsWith(result.search),
    resultStartsWithSourceSearchParams: result.search.startsWith(source.search),
    sourceSearchParamsLength: getCharCount(source.search),
    resultSearchParamsLength: getCharCount(result.search)
  };

  if (
    source.hostname.replace(/^www\./i, '') ===
    result.hostname.replace(/^www\./i, '')
  ) {
    data.hostWithoutCommonSubdomainsMatch = true;
  }

  return data;
}

function getResultRank(item) {
  if (
    item.protocolMatch &&
    item.hostMatch &&
    item.pathMatch &&
    item.searchParamsMatch
  ) {
    return 1;
  }

  if (item.hostMatch && item.pathMatch && item.searchParamsMatch) {
    return 2;
  }

  if (
    item.hostWithoutCommonSubdomainsMatch &&
    item.pathMatch &&
    item.searchParamsMatch
  ) {
    return 3;
  }

  if (
    item.hostWithoutCommonSubdomainsMatch &&
    item.pathMatch &&
    ((item.resultSearchParamsLength &&
      item.sourceStartsWithResultSearchParams) ||
      (item.sourceSearchParamsLength &&
        item.resultStartsWithSourceSearchParams))
  ) {
    return 4;
  }

  if (item.hostWithoutCommonSubdomainsMatch && item.pathMatch) {
    return 5;
  }

  if (
    item.hostWithoutCommonSubdomainsMatch &&
    ((item.resultPathLength && item.sourceStartsWithResultPath) ||
      (item.sourcePathLength && item.resultStartsWithSourcePath))
  ) {
    return 6;
  }

  if (item.domainMatch && item.pathMatch && item.searchParamsMatch) {
    return 7;
  }

  if (
    item.domainMatch &&
    item.pathMatch &&
    ((item.resultSearchParamsLength &&
      item.sourceStartsWithResultSearchParams) ||
      (item.sourceSearchParamsLength &&
        item.resultStartsWithSourceSearchParams))
  ) {
    return 8;
  }

  if (item.domainMatch && item.pathMatch) {
    return 9;
  }

  if (
    item.domainMatch &&
    ((item.resultPathLength && item.sourceStartsWithResultPath) ||
      (item.sourcePathLength && item.resultStartsWithSourcePath))
  ) {
    return 10;
  }

  if (item.hostMatch) {
    return 11;
  }

  if (item.domainMatch) {
    return 12;
  }
}

function getRankedResults({sourceUrl, results} = {}) {
  const items = [];

  for (const result of results) {
    const resultDetails = processResult(sourceUrl, result.url);
    const rank = getResultRank(resultDetails);

    if (rank) {
      items.push({result, resultDetails, rank});
    }
  }

  items.sort(function (a, b) {
    if (a.rank < b.rank) {
      return -1;
    } else if (a.rank > b.rank) {
      return 1;
    } else if (
      a.resultDetails.resultUrl.length < b.resultDetails.resultUrl.length
    ) {
      return -1;
    } else if (
      a.resultDetails.resultUrl.length > b.resultDetails.resultUrl.length
    ) {
      return 1;
    } else {
      return 0;
    }
  });

  return items.map(item => item.result);
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

export {
  showEngineError,
  sendReceipt,
  initSearch,
  getRankedResults,
  searchPermacc
};
