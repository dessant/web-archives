import browser from 'webextension-polyfill';
import {v4 as uuidv4} from 'uuid';

import {initStorage} from 'storage/init';
import storage from 'storage/storage';
import {
  getText,
  createTab,
  executeCode,
  executeFile,
  onComplete,
  isAndroid,
  getActiveTab
} from 'utils/common';
import {
  getEnabledEngines,
  showNotification,
  validateUrl,
  normalizeUrl,
  showContributePage
} from 'utils/app';
import {optionKeys, engines, errorCodes, chromeDesktopUA} from 'utils/data';
import {targetEnv} from 'utils/config';

const dataStorage = {};

function addStorageItem(data, {deleteFn, expiryTime = 0} = {}) {
  const storageKey = uuidv4();
  dataStorage[storageKey] = {...data, deleteFn};

  if (expiryTime) {
    window.setTimeout(function () {
      deleteStorageItem(storageKey);
    }, expiryTime);
  }

  return storageKey;
}

function getStorageItem(storageKey) {
  return dataStorage[storageKey];
}

function updateStorageItem(storageKey, data) {
  const storedData = dataStorage[storageKey];
  if (storedData) {
    Object.assign(storedData, data);
  } else {
    throw new Error('storage item does not exist');
  }

  return storedData;
}

function deleteStorageItem(storageKey) {
  const storedData = dataStorage[storageKey];
  if (storedData) {
    if (storedData.deleteFn) {
      storedData.deleteFn(storedData);
    }
    delete dataStorage[storageKey];
    return storedData;
  }
}

function getEngineMenuIcons(engine) {
  if (engine === 'googleText') {
    engine = 'google';
  } else if (engine === 'archiveOrgAll') {
    engine = 'archiveOrg';
  } else if (engine === 'archiveIsAll') {
    engine = 'archiveIs';
  }

  if (['gigablast', 'megalodon'].includes(engine)) {
    return {
      16: `src/icons/engines/${engine}-16.png`,
      32: `src/icons/engines/${engine}-32.png`
    };
  } else {
    return {
      16: `src/icons/engines/${engine}.svg`
    };
  }
}

function createMenuItem({
  id,
  title = '',
  contexts,
  parent,
  type = 'normal',
  urlPatterns = ['http://*/*', 'https://*/*', 'ftp://*/*'],
  icons = null
}) {
  const params = {
    id,
    title,
    contexts,
    documentUrlPatterns: urlPatterns,
    parentId: parent,
    type
  };
  if (icons) {
    params.icons = icons;
  }
  browser.contextMenus.create(params, onComplete);
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
  const setIcons = targetEnv === 'firefox';

  if (enEngines.length === 1) {
    const engine = enEngines[0];
    createMenuItem({
      id: engine,
      title: getText(
        'actionTitle_engine_main',
        getText(`engineName_${engine}_short`)
      ),
      contexts
    });
    return;
  }

  if (enEngines.length > 1) {
    const searchAllEngines = options.searchAllEnginesContextMenu;

    if (searchAllEngines === 'main') {
      createMenuItem({
        id: 'allEngines',
        title: getText('actionTitle_allEngines_main'),
        contexts
      });
      return;
    }

    createMenuItem({
      id: 'par-1',
      title: getText('extensionName'),
      contexts
    });

    if (searchAllEngines === 'sub') {
      createMenuItem({
        id: 'allEngines',
        title: getText('engineName_allEngines_full'),
        contexts,
        parent: 'par-1',
        icons: setIcons && getEngineMenuIcons('allEngines')
      });
      createMenuItem({
        id: 'sep-1',
        contexts,
        parent: 'par-1',
        type: 'separator'
      });
    }

    enEngines.forEach(function (engine) {
      createMenuItem({
        id: engine,
        title: getText(`engineName_${engine}_short`),
        contexts,
        parent: 'par-1',
        icons: setIcons && getEngineMenuIcons(engine)
      });
    });
  }
}

async function getTabUrl(url, engineId, options) {
  if (
    !['archiveOrg', 'archiveOrgAll', 'archiveIs', 'archiveIsAll'].includes(
      engineId
    )
  ) {
    url = encodeURIComponent(url);
  }

  let tabUrl = engines[engineId].url.replace(/{url}/g, url);
  if (engineId === 'webcite') {
    tabUrl = tabUrl.replace('{date}', new Date().toISOString().split('T')[0]);
  }

  return tabUrl;
}

async function searchUrl(url, menuId, tabIndex, tabId) {
  if (!validateUrl(url)) {
    await showNotification({messageId: 'error_invalidUrl'});
    return;
  }

  const options = await storage.get(optionKeys, 'sync');

  const searchEngines =
    menuId === 'allEngines' ? await getEnabledEngines(options) : [menuId];

  const storageKey = addStorageItem(
    {url, searchEngines, scripts: {}},
    {
      deleteFn: function (data) {
        for (const {script} of Object.values(data.scripts)) {
          script.unregister();
        }
      },
      expiryTime: 600000 // 10 minutes
    }
  );

  let tabActive = !options.tabInBackgound;
  tabIndex = tabIndex + 1;

  let {searchCount} = await storage.get('searchCount', 'sync');
  searchCount += 1;
  await storage.set({searchCount}, 'sync');
  if ([10, 30].includes(searchCount)) {
    await showContributePage('search');
    tabIndex += 1;
    tabActive = false;
  }

  if (searchEngines.length > 1) {
    options.openNewTab = true;
    for (const engine of searchEngines) {
      await searchEngine(
        url,
        engine,
        options,
        tabId,
        tabIndex,
        tabActive,
        storageKey
      );
      tabIndex = tabIndex + 1;
      tabActive = false;
    }
  } else {
    await searchEngine(
      url,
      searchEngines[0],
      options,
      tabId,
      tabIndex,
      tabActive,
      storageKey
    );
  }
}

async function searchEngine(
  url,
  engineId,
  options,
  tabId,
  tabIndex,
  tabActive,
  storageKey
) {
  if (['archiveOrg', 'archiveOrgAll'].includes(engineId)) {
    url = normalizeUrl(url);
  }

  // workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1267027
  const registerContentScript =
    engineId === 'yandex' && targetEnv === 'firefox';
  const registeredScripts = {};

  if (registerContentScript) {
    const scriptKey = uuidv4();
    registeredScripts[scriptKey] = {
      script: await browser.contentScripts.register({
        matches: [
          'https://*.yandex.com/*',
          'https://*.yandex.ru/*',
          'https://*.yandex.ua/*',
          'https://*.yandex.by/*',
          'https://*.yandex.kz/*',
          'https://*.yandex.uz/*',
          'https://*.yandex.com.tr/*'
        ],
        js: [
          {
            code: `
            var scriptKey = '${scriptKey}';
            var storageKey = '${storageKey}';
            `
          },
          {file: '/src/content/engines/yandex.js'}
        ],
        runAt: 'document_idle'
      })
    };
  }

  const tabUrl = await getTabUrl(url, engineId, options);

  if (options.openNewTab) {
    const tab = await createTab(tabUrl, {
      index: tabIndex,
      active: tabActive,
      openerTabId: tabId
    });
    tabId = tab.id;
  } else {
    await browser.tabs.update(tabId, {url: tabUrl});
  }

  // Some search engines only show cache links on desktop
  if (await isAndroid()) {
    if (['qihoo'].includes(engineId)) {
      const requestCallback = function (details) {
        for (const header of details.requestHeaders) {
          if (header.name.toLowerCase() === 'user-agent') {
            header.value = chromeDesktopUA;
            break;
          }
        }
        return {requestHeaders: details.requestHeaders};
      };

      browser.webRequest.onBeforeSendHeaders.addListener(
        requestCallback,
        {
          urls: ['http://*/*', 'https://*/*'],
          tabId
        },
        ['blocking', 'requestHeaders']
      );
    }
  }

  if (registerContentScript) {
    Object.values(registeredScripts).forEach(script => {
      script.tabId = tabId;
    });
    Object.assign(getStorageItem(storageKey).scripts, registeredScripts);
  } else {
    await evalExecEngine(tabId, engineId, storageKey);
  }
}

async function evalExecEngine(tabId, engineId, storageKey) {
  const execEngines = [
    'bing',
    'yandex',
    'gigablast',
    'sogou',
    'qihoo',
    'baidu',
    'naver',
    'yahooJp',
    'megalodon'
  ];
  if (execEngines.includes(engineId)) {
    const scriptKey = uuidv4();

    const requestCallback = async function (response) {
      if (response.statusCode === 200) {
        await execEngineContent(tabId, engineId, storageKey, scriptKey);
      }
    };
    const removeCallbacks = function (details) {
      window.clearTimeout(timeoutId);
      browser.webRequest.onHeadersReceived.removeListener(requestCallback);
      browser.webRequest.onErrorOccurred.removeListener(removeCallbacks);
    };
    const timeoutId = window.setTimeout(removeCallbacks, 120000); // 2 minutes

    getStorageItem(storageKey).scripts[scriptKey] = {
      tabId,
      script: {
        unregister: removeCallbacks
      }
    };

    const requestFilter = {
      tabId,
      types: ['main_frame'],
      urls: ['http://*/*', 'https://*/*']
    };
    browser.webRequest.onHeadersReceived.addListener(
      requestCallback,
      requestFilter
    );
    browser.webRequest.onErrorOccurred.addListener(
      removeCallbacks,
      requestFilter
    );
  }
}

async function execEngineContent(tabId, engineId, storageKey, scriptKey) {
  // workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1290016
  const tabUpdateCallback = async function (eventTabId, changes, tab) {
    if (eventTabId === tabId && tab.status === 'complete') {
      removeCallbacks();

      await executeCode(
        `
        var storageKey = '${storageKey}';
        var scriptKey = '${scriptKey}';
        `,
        tabId,
        0,
        'document_idle'
      );

      executeFile(
        `/src/content/engines/${engineId}.js`,
        tabId,
        0,
        'document_idle'
      );
    }
  };

  const removeCallbacks = function (details) {
    window.clearTimeout(timeoutId);
    browser.tabs.onUpdated.removeListener(tabUpdateCallback);
  };
  const timeoutId = window.setTimeout(removeCallbacks, 120000); // 2 minutes

  browser.tabs.onUpdated.addListener(tabUpdateCallback);
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
    await showNotification({messageId: 'error_allEnginesDisabled'});
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
  const tab = await getActiveTab();
  await searchUrl(url || tab.url, engine, tab.index, tab.id);
}

function onMessage(request, sender, sendResponse) {
  if (request.id === 'actionPopupSubmit') {
    onActionPopupClick(request.engine, request.pageUrl);
  } else if (request.id === 'initScript') {
    const data = getStorageItem(request.storageKey);
    if (data) {
      const scriptKey = request.scriptKey;
      const scriptData = data.scripts[scriptKey];

      if (scriptData) {
        const tabId = sender.tab.id;

        if (scriptData.tabId === tabId) {
          scriptData.script.unregister();
          delete data.scripts[scriptKey];

          browser.tabs.sendMessage(
            tabId,
            {id: 'initScript', url: data.url},
            {frameId: 0}
          );
        }
      }
    }
  }
}

async function onStorageChange(changes, area) {
  await setContextMenu(true);
  await setBrowserAction();
  setRequestListeners();
}

async function setContextMenu(removeFirst = false) {
  if (targetEnv === 'firefox' && (await isAndroid())) {
    return;
  }
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
  if (errorCodes.includes(details.statusCode)) {
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
      const requestFilter = {
        types: ['main_frame'],
        urls: ['http://*/*', 'https://*/*']
      };

      browser.webRequest.onCompleted.addListener(
        requestCompletedCallback,
        requestFilter
      );

      browser.webRequest.onErrorOccurred.addListener(
        requestErrorCallback,
        requestFilter
      );
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
  await initStorage('sync');
  await setContextMenu();
  await setBrowserAction();
  setRequestListeners();
  addStorageListener();
  addMessageListener();
}

document.addEventListener('DOMContentLoaded', onLoad);
