import browser from 'webextension-polyfill';

import storage from 'storage/storage';
import {
  getText,
  createTab,
  executeCode,
  executeFile,
  onComplete
} from 'utils/common';
import {getEnabledEngines, showNotification, validateUrl} from 'utils/app';
import {optionKeys, engines} from 'utils/data';
import {targetEnv} from 'utils/config';

function createMenuItem(id, title, contexts, parentId, type = 'normal') {
  browser.contextMenus.create(
    {
      id: id,
      title: title,
      contexts: contexts,
      documentUrlPatterns: ['http://*/*', 'https://*/*', 'ftp://*/*'],
      parentId: parentId,
      type: type
    },
    onComplete
  );
}

async function createMenu(options) {
  const enEngines = await getEnabledEngines(options);
  const contexts =
    options.showInContextMenu === 'all'
      ? [
          'audio',
          'editable',
          'frame',
          'image',
          'link',
          'page',
          'selection',
          'video'
        ]
      : ['link'];

  if (enEngines.length === 1) {
    const engine = enEngines[0];
    createMenuItem(
      engine,
      getText('actionTitle_engine_main', getText(`engineName_${engine}_short`)),
      contexts
    );
    return;
  }

  if (enEngines.length > 1) {
    const searchAllEngines = options.searchAllEnginesContextMenu;

    if (searchAllEngines === 'main') {
      createMenuItem(
        'allEngines',
        getText('actionTitle_allEngines_main'),
        contexts
      );
      return;
    }

    createMenuItem(
      'par-1',
      getText('contextMenuGroupTitle_viewArchive_main'),
      contexts
    );

    if (searchAllEngines === 'sub') {
      createMenuItem(
        'allEngines',
        getText('engineName_allEngines_full'),
        contexts,
        'par-1'
      );
      createMenuItem('sep-1', '', contexts, 'par-1', 'separator');
    }

    enEngines.forEach(function(engineId) {
      createMenuItem(
        engineId,
        getText(`engineName_${engineId}_short`),
        contexts,
        'par-1'
      );
    });
  }
}

async function getTabUrl(url, engineId, options) {
  let tabUrl = engines[engineId].url.replace(/{url}/g, encodeURIComponent(url));
  if (engineId === 'webcite') {
    tabUrl = tabUrl.replace('{date}', new Date().toISOString().split('T')[0]);
  }

  return tabUrl;
}

async function searchUrl(url, menuId, tabIndex, tabId) {
  if (!validateUrl(url)) {
    await showNotification('error_invalidUrl');
    return;
  }

  const options = await storage.get(optionKeys, 'sync');

  let tabActive = !options.tabInBackgound;
  tabIndex = tabIndex + 1;

  if (menuId === 'allEngines') {
    options.openNewTab = true;
    for (const engine of await getEnabledEngines(options)) {
      await searchEngine(url, engine, options, tabId, tabIndex, tabActive);
      tabIndex = tabIndex + 1;
      tabActive = false;
    }
  } else {
    await searchEngine(url, menuId, options, tabId, tabIndex, tabActive);
  }
}

async function searchEngine(
  url,
  engineId,
  options,
  tabId,
  tabIndex,
  tabActive
) {
  const tabUrl = await getTabUrl(url, engineId, options);

  if (options.openNewTab) {
    const tab = await createTab(tabUrl, tabIndex, tabActive);
    tabId = tab.id;
  } else {
    await browser.tabs.update(tabId, {url: tabUrl});
  }

  await evalExecEngine(tabId, engineId, url);
}

async function evalExecEngine(tabId, engineId, url) {
  const execEngines = [
    'bing',
    'yandex',
    'archiveIs',
    'gigablast',
    'sogou',
    'qihoo',
    'baidu',
    'naver',
    'yahooJp',
    'megalodon'
  ];
  if (execEngines.indexOf(engineId) !== -1) {
    const requestCompletedCallback = async function(response) {
      if (response.statusCode === 200) {
        removeCallbacks();
        await execEngineContent(tabId, engineId, url);
      }
    };
    const removeCallbacks = function(details) {
      window.clearTimeout(timeoutId);
      browser.webRequest.onCompleted.removeListener(requestCompletedCallback);
      browser.webRequest.onErrorOccurred.removeListener(removeCallbacks);
    };
    const timeoutId = window.setTimeout(removeCallbacks, 120000); // 2 minutes

    browser.webRequest.onCompleted.addListener(requestCompletedCallback, {
      tabId: tabId,
      types: ['main_frame'],
      urls: ['http://*/*', 'https://*/*']
    });
    browser.webRequest.onErrorOccurred.addListener(removeCallbacks, {
      tabId: tabId,
      types: ['main_frame'],
      urls: ['http://*/*', 'https://*/*']
    });
  }
}

async function execEngineContent(tabId, engineId, url) {
  const urlExecEngines = ['bing', 'sogou', 'qihoo', 'naver', 'yahooJp'];

  // workaround for Bugzilla@Mozilla#1290016
  const tabUpdateCallback = async function(eventTabId, changes, tab) {
    if (eventTabId === tabId && tab.status === 'complete') {
      removeCallbacks();
      if (urlExecEngines.indexOf(engineId) !== -1) {
        await executeCode(`var url = '${url}';`, tabId, 0, 'document_idle');
      }
      executeFile(
        `/src/content/engines/${engineId}.js`,
        tabId,
        0,
        'document_idle'
      );
    }
  };
  const removeCallbacks = function(details) {
    window.clearTimeout(timeoutId);
    browser.tabs.onUpdated.removeListener(tabUpdateCallback);
  };
  const timeoutId = window.setTimeout(removeCallbacks, 120000); // 2 minutes

  browser.tabs.onUpdated.addListener(tabUpdateCallback);

  const tab = await browser.tabs.get(tabId);
  if (tab.status === 'complete') {
    tabUpdateCallback();
  }
}

async function onContextMenuItemClick(info, tab) {
  await searchUrl(
    info.linkUrl ? info.linkUrl : info.pageUrl,
    info.menuItemId,
    tab.index,
    tab.id
  );
}

async function onActionClick(tab) {
  const options = await storage.get(
    ['engines', 'disabledEngines', 'searchAllEnginesAction'],
    'sync'
  );
  const enEngines = await getEnabledEngines(options);

  if (enEngines.length === 0) {
    await showNotification('error_allEnginesDisabled');
    return;
  }

  let engine = null;
  if (options.searchAllEnginesAction === 'main' && enEngines.length > 1) {
    engine = 'allEngines';
  } else {
    engine = enEngines[0];
  }

  await searchUrl(tab.url, engine, tab.index, tab.id);
}

async function onActionPopupClick(engine, url) {
  const [tab, ...rest] = await browser.tabs.query({
    lastFocusedWindow: true,
    active: true
  });
  await searchUrl(url || tab.url, engine, tab.index, tab.id);
}

function onMessage(request, sender, sendResponse) {
  if (request.id === 'actionPopupSubmit') {
    onActionPopupClick(request.engine, request.customUrl);
  }
}

async function onStorageChange(changes, area) {
  await setContextMenu(true);
  await setBrowserAction();
  setRequestListeners();
}

async function setContextMenu(removeFirst = false) {
  if (removeFirst) {
    await browser.contextMenus.removeAll();
  }
  const options = await storage.get(optionKeys, 'sync');
  const hasListener = browser.contextMenus.onClicked.hasListener(
    onContextMenuItemClick
  );
  if (options.showInContextMenu !== 'false') {
    if (!hasListener) {
      browser.contextMenus.onClicked.addListener(onContextMenuItemClick);
    }
    await createMenu(options);
  } else {
    if (hasListener) {
      browser.contextMenus.onClicked.removeListener(onContextMenuItemClick);
    }
  }
}

async function showPageAction(tabId) {
  await setPageAction(tabId);
  browser.pageAction.show(tabId);
}

async function requestCompletedCallback(details) {
  const statusCodes = [
    400,
    403,
    404,
    408,
    410,
    429,
    451,
    500,
    502,
    503,
    504,
    // Nonstandard
    444,
    450,
    509,
    530,
    598,
    // Cloudflare
    520,
    521,
    522,
    523,
    524,
    525,
    526,
    527
  ];

  if (statusCodes.indexOf(details.statusCode) !== -1) {
    await showPageAction(details.tabId);
  }
}

async function requestErrorCallback(details) {
  await showPageAction(details.tabId);
}

async function setRequestListeners() {
  if (targetEnv !== 'firefox') {
    return;
  }

  const {showPageAction} = await storage.get('showPageAction', 'sync');
  const hasListener = browser.webRequest.onCompleted.hasListener(
    requestCompletedCallback
  );

  if (showPageAction) {
    if (!hasListener) {
      browser.webRequest.onCompleted.addListener(requestCompletedCallback, {
        types: ['main_frame'],
        urls: ['http://*/*', 'https://*/*']
      });

      browser.webRequest.onErrorOccurred.addListener(requestErrorCallback, {
        types: ['main_frame'],
        urls: ['http://*/*', 'https://*/*']
      });
    }
  } else {
    if (hasListener) {
      browser.webRequest.onCompleted.removeListener(requestCompletedCallback);
      browser.webRequest.onErrorOccurred.removeListener(requestErrorCallback);
    }
  }
}

async function setPageAction(tabId) {
  const options = await storage.get(
    ['engines', 'disabledEngines', 'searchAllEnginesAction'],
    'sync'
  );
  const enEngines = await getEnabledEngines(options);
  const hasListener = browser.pageAction.onClicked.hasListener(onActionClick);

  if (enEngines.length === 1) {
    if (!hasListener) {
      browser.pageAction.onClicked.addListener(onActionClick);
    }
    browser.pageAction.setTitle({
      tabId: tabId,
      title: getText(
        'actionTitle_engine_main',
        getText(`engineName_${enEngines[0]}_short`)
      )
    });
    browser.pageAction.setPopup({tabId: tabId, popup: ''});
    return;
  }

  if (options.searchAllEnginesAction === 'main' && enEngines.length > 1) {
    if (!hasListener) {
      browser.pageAction.onClicked.addListener(onActionClick);
    }
    browser.pageAction.setTitle({
      tabId: tabId,
      title: getText('actionTitle_allEngines_main')
    });
    browser.pageAction.setPopup({tabId: tabId, popup: ''});
    return;
  }

  browser.pageAction.setTitle({tabId: tabId, title: getText('extensionName')});
  if (enEngines.length === 0) {
    if (!hasListener) {
      browser.pageAction.onClicked.addListener(onActionClick);
    }
    browser.pageAction.setPopup({tabId: tabId, popup: ''});
  } else {
    if (hasListener) {
      browser.pageAction.onClicked.removeListener(onActionClick);
    }
    browser.pageAction.setPopup({
      tabId: tabId,
      popup: '/src/action/index.html'
    });
  }
}

async function setBrowserAction() {
  const options = await storage.get(
    ['engines', 'disabledEngines', 'searchAllEnginesAction'],
    'sync'
  );
  const enEngines = await getEnabledEngines(options);
  const hasListener = browser.browserAction.onClicked.hasListener(
    onActionClick
  );

  if (enEngines.length === 1) {
    if (!hasListener) {
      browser.browserAction.onClicked.addListener(onActionClick);
    }
    browser.browserAction.setTitle({
      title: getText(
        'actionTitle_engine_main',
        getText(`engineName_${enEngines[0]}_short`)
      )
    });
    browser.browserAction.setPopup({popup: ''});
    return;
  }

  if (options.searchAllEnginesAction === 'main' && enEngines.length > 1) {
    if (!hasListener) {
      browser.browserAction.onClicked.addListener(onActionClick);
    }
    browser.browserAction.setTitle({
      title: getText('actionTitle_allEngines_main')
    });
    browser.browserAction.setPopup({popup: ''});
    return;
  }

  browser.browserAction.setTitle({title: getText('extensionName')});
  if (enEngines.length === 0) {
    if (!hasListener) {
      browser.browserAction.onClicked.addListener(onActionClick);
    }
    browser.browserAction.setPopup({popup: ''});
  } else {
    if (hasListener) {
      browser.browserAction.onClicked.removeListener(onActionClick);
    }
    browser.browserAction.setPopup({popup: '/src/action/index.html'});
  }
}

function addStorageListener() {
  browser.storage.onChanged.addListener(onStorageChange);
}

function addMessageListener() {
  browser.runtime.onMessage.addListener(onMessage);
}

async function onLoad() {
  await storage.init('sync');
  await setContextMenu();
  await setBrowserAction();
  setRequestListeners();
  addStorageListener();
  addMessageListener();
}

document.addEventListener('DOMContentLoaded', onLoad);
