import browser from 'webextension-polyfill';
import {v4 as uuidv4} from 'uuid';
import Queue from 'p-queue';

import {initStorage, migrateLegacyStorage} from 'storage/init';
import {isStorageReady} from 'storage/storage';
import storage from 'storage/storage';
import {
  getText,
  createTab,
  getNewTabUrl,
  executeCode,
  executeFile,
  onComplete,
  isAndroid,
  getActiveTab,
  getPlatform
} from 'utils/common';
import {
  getEnabledEngines,
  getSearches,
  showNotification,
  validateUrl,
  normalizeUrl,
  insertBaseModule,
  showContributePage,
  isContextMenuSupported,
  checkSearchEngineAccess
} from 'utils/app';
import registry from 'utils/registry';
import {
  optionKeys,
  engines,
  errorCodes,
  chromeMobileUA,
  chromeDesktopUA
} from 'utils/data';
import {targetEnv, enableContributions} from 'utils/config';

const queue = new Queue({concurrency: 1});

function setUserAgentHeader(tabId, userAgent) {
  const engineRequestCallback = function (details) {
    for (const header of details.requestHeaders) {
      if (header.name.toLowerCase() === 'user-agent') {
        header.value = userAgent;
        break;
      }
    }
    return {requestHeaders: details.requestHeaders};
  };

  browser.webRequest.onBeforeSendHeaders.addListener(
    engineRequestCallback,
    {
      urls: ['http://*/*', 'https://*/*'],
      tabId
    },
    ['blocking', 'requestHeaders']
  );
}

function getEngineMenuIcons(engine) {
  if (engine === 'googleText') {
    engine = 'google';
  } else if (engine === 'archiveOrgAll') {
    engine = 'archiveOrg';
  } else if (engine === 'archiveIsAll') {
    engine = 'archiveIs';
  }

  if (['gigablast'].includes(engine)) {
    return {
      16: `src/assets/icons/engines/${engine}-16.png`,
      32: `src/assets/icons/engines/${engine}-32.png`
    };
  } else {
    return {
      16: `src/assets/icons/engines/${engine}.svg`
    };
  }
}

function createMenuItem({
  id,
  title = '',
  contexts,
  parent,
  type = 'normal',
  urlPatterns,
  icons
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
  // creates context menu item for current instance
  browser.contextMenus.create(params, onComplete);
}

async function createMenu() {
  const options = await storage.get(optionKeys);

  const enEngines = await getEnabledEngines(options);

  const contexts = [];
  if (options.showInContextMenu === 'all') {
    contexts.push(
      'audio',
      'editable',
      'frame',
      'image',
      'link',
      'selection',
      'video'
    );
    if (!(await isAndroid())) {
      contexts.push('page');
    }
  } else {
    contexts.push('link');
  }

  const urlPatterns = ['http://*/*', 'https://*/*'];

  let setIcons = false;
  if (targetEnv === 'firefox') {
    if (options.showInContextMenu === 'link') {
      urlPatterns.push('file:///*');
    }
    setIcons = options.showEngineIcons;
  }

  if (enEngines.length === 1) {
    const engine = enEngines[0];
    createMenuItem({
      id: `search_${engine}`,
      title: getText(
        'mainMenuItemTitle_engine',
        getText(`menuItemTitle_${engine}`)
      ),
      contexts,
      urlPatterns
    });
    return;
  }

  if (enEngines.length > 1) {
    if (targetEnv !== 'samsung') {
      const searchAllEngines = options.searchAllEnginesContextMenu;

      if (searchAllEngines === 'main') {
        createMenuItem({
          id: 'search_allEngines',
          title: getText('mainMenuItemTitle_allEngines'),
          contexts,
          urlPatterns
        });
        return;
      }

      if (searchAllEngines === 'sub') {
        createMenuItem({
          id: 'search_allEngines',
          title: getText('menuItemTitle_allEngines'),
          contexts,
          urlPatterns,
          icons: setIcons && getEngineMenuIcons('allEngines')
        });
        // Samsung Internet: separator not visible, creates gap that responds to input.
        createMenuItem({
          id: 'sep-1',
          contexts,
          type: 'separator',
          urlPatterns
        });
      }
    }

    enEngines.forEach(function (engine) {
      createMenuItem({
        id: `search_${engine}`,
        title: getText(`menuItemTitle_${engine}`),
        contexts,
        urlPatterns,
        icons: setIcons && getEngineMenuIcons(engine)
      });
    });
  }
}

async function createSession(data) {
  const session = {
    sessionOrigin: '',
    sessionType: 'search',
    searchMode: '',
    sourceTabId: -1,
    sourceTabIndex: -1,
    sourceFrameId: -1,
    engineGroup: '',
    engines: [],
    options: {}
  };

  session.options = await storage.get(optionKeys);

  if (data.options) {
    Object.assign(session.options, data.options);

    delete data.options;
  }

  if (data.engine) {
    if (data.engine === 'allEngines') {
      const enabledEngines = await getEnabledEngines(session.options);
      session.engineGroup = 'allEngines';
      session.engines = enabledEngines;
    } else {
      session.engines.push(data.engine);
    }

    delete data.engine;
  }

  Object.assign(session, data);

  if (!session.searchMode) {
    session.searchMode =
      session.sessionOrigin === 'action'
        ? session.options.searchModeAction
        : session.options.searchModeContextMenu;
  }

  return session;
}

async function getTabUrl(session, search, doc, taskId) {
  const engine = search.engine;
  let tabUrl = engines[engine].target;

  if (search.isTaskId) {
    tabUrl = tabUrl.replace('{id}', taskId);
  }

  let url = doc.docUrl;

  if (['archiveOrg', 'archiveOrgAll'].includes(search.engine)) {
    url = normalizeUrl(url);
  }

  if (
    ![
      'archiveOrg',
      'archiveOrgAll',
      'archiveIs',
      'archiveIsAll',
      'memento'
    ].includes(engine)
  ) {
    url = encodeURIComponent(url);
  }

  if (engine === 'memento') {
    const date = new Date();
    date.setUTCMinutes(date.getUTCMinutes() - 1);

    tabUrl = tabUrl.replace(
      '{date}',
      date.toISOString().split('.')[0].replace(/[-T:]/g, '')
    );
  }

  tabUrl = tabUrl.replace(/{url}/g, url);

  return tabUrl;
}

async function initSearch(session, docs) {
  if (['chrome', 'opera'].includes(targetEnv)) {
    checkSearchEngineAccess();
  }

  if (!Array.isArray(docs)) {
    docs = [docs];
  }

  const tab = await browser.tabs.get(session.sourceTabId);
  session.sourceTabIndex = tab.index;

  let firstBatchItem = true;
  for (const doc of docs) {
    await searchDocument(session, doc, firstBatchItem);
    firstBatchItem = false;
  }
}

async function searchDocument(session, doc, firstBatchItem = true) {
  if (!validateUrl(doc.docUrl)) {
    await showNotification({messageId: 'error_invalidUrl'});
    return;
  }

  let tabActive = firstBatchItem;

  let contributePageTabId;
  if (enableContributions && firstBatchItem) {
    let {useCount} = await storage.get('useCount');
    useCount += 1;
    await storage.set({useCount});
    if ([10, 30].includes(useCount)) {
      const tab = await showContributePage('search');
      contributePageTabId = tab.id;
      session.sourceTabIndex += 1;
      tabActive = false;
    }
  }

  tabActive = !session.options.tabInBackgound && tabActive;

  const searches = await getSearches(session.engines);

  const receiptSearches = searches.filter(item => item.sendsReceipt);

  let docId;
  if (receiptSearches.length) {
    docId = await registry.addStorageItem(doc, {
      receipts: {expected: receiptSearches.length, received: 0},
      expiryTime: 10.0,
      area: 'indexeddb'
    });
  }

  for (const search of searches) {
    session.sourceTabIndex += 1;
    await searchEngine(session, search, doc, docId, tabActive);

    tabActive = false;
  }

  if ((await isAndroid()) && contributePageTabId) {
    await browser.tabs.update(contributePageTabId, {active: true});
  }
}

async function searchEngine(session, search, doc, docId, tabActive) {
  let taskId;
  if (search.sendsReceipt) {
    taskId = await registry.addStorageItem(
      {session, search, docId},
      {
        receipts: {expected: 1, received: 0},
        expiryTime: 10.0,
        isTask: true
      }
    );
  }

  const token = uuidv4();

  const tab = await createTab({
    token,
    index: session.sourceTabIndex,
    active: tabActive
  });
  const tabId = tab.id;

  if (search.sendsReceipt) {
    await registry.addTaskRegistryItem({taskId, tabId});
  }

  const tabUrl = await getTabUrl(session, search, doc, taskId);

  await setupNewEngineTab(tabId, tabUrl, token, search.engine);
}

async function setupNewEngineTab(tabId, tabUrl, token, engine) {
  let beaconToken;
  const userAgent = await getRequiredUserAgent(engine);
  if (userAgent) {
    if (targetEnv === 'samsung') {
      // Samsung Internet 13: webRequest listener filtering by tab ID
      // provided by tabs.createTab returns requests from different tab.
      beaconToken = uuidv4();

      function requestCallback(details) {
        removeCallback();
        setUserAgentHeader(details.tabId, userAgent);
      }

      const removeCallback = function () {
        window.clearTimeout(timeoutId);
        browser.webRequest.onBeforeRequest.removeListener(requestCallback);
      };
      const timeoutId = window.setTimeout(removeCallback, 10000); // 10 seconds

      browser.webRequest.onBeforeRequest.addListener(
        requestCallback,
        {
          urls: [getNewTabUrl(beaconToken)],
          types: ['main_frame']
        },
        ['blocking']
      );
    } else {
      setUserAgentHeader(tabId, userAgent);
    }
  }

  if (beaconToken) {
    await registry.addStorageItem(
      {tabUrl, keepHistory: false},
      {
        receipts: {expected: 1, received: 0},
        expiryTime: 1.0,
        token: beaconToken
      }
    );
  }

  await registry.addStorageItem(
    {
      tabUrl: beaconToken ? getNewTabUrl(beaconToken) : tabUrl,
      keepHistory: false
    },
    {
      receipts: {expected: 1, received: 0},
      expiryTime: 1.0,
      token
    }
  );

  if (targetEnv === 'safari') {
    browser.runtime
      .sendMessage({id: 'setTabLocation', token})
      .catch(err => null);
  } else {
    browser.tabs
      .sendMessage(tabId, {id: 'setTabLocation', token}, {frameId: 0})
      .catch(err => null);
  }
}

async function getRequiredUserAgent(engine) {
  if (await isAndroid()) {
    // Google only works with a Chrome user agent on Firefox for Android,
    // while other search engines may need a desktop user agent.
    if (targetEnv === 'firefox' && ['google', 'googleText'].includes(engine)) {
      return chromeMobileUA;
    } else if (
      [
        'yandex',
        'qihoo',
        'baidu',
        'yahooJp',
        'bing',
        'mailru',
        'yahoo'
      ].includes(engine)
    ) {
      return chromeDesktopUA;
    }
  }
}

async function execEngine(tabId, engine, taskId) {
  await executeCode(`var taskId = '${taskId}';`, tabId);
  await executeFile(`/src/commons-engine/script.js`, tabId);
  await executeFile(`/src/engines/${engine}/script.js`, tabId);
}

async function onContextMenuItemClick(info, tab) {
  if (targetEnv === 'samsung' && tab.id !== browser.tabs.TAB_ID_NONE) {
    // Samsung Internet 13: contextMenus.onClicked provides wrong tab index.
    tab = await browser.tabs.get(tab.id);
  }

  const [sessionType, engine] = info.menuItemId.split('_');

  const sessionData = {
    sessionOrigin: 'context',
    sessionType,
    sourceTabId: tab.id,
    sourceTabIndex: tab.index,
    sourceFrameId: typeof info.frameId !== 'undefined' ? info.frameId : 0
  };
  if (sessionType === 'search') {
    sessionData.engine = engine;
  }

  const session = await createSession(sessionData);

  initSearch(session, {docUrl: info.linkUrl || info.pageUrl});
}

async function onActionClick(session, docUrl) {
  initSearch(session, {docUrl});
}

async function onActionButtonClick(tab) {
  if (targetEnv === 'samsung' && tab.id !== browser.tabs.TAB_ID_NONE) {
    // Samsung Internet 13: browserAction.onClicked provides wrong tab index.
    tab = await browser.tabs.get(tab.id);
  }

  const session = await createSession({
    sessionOrigin: 'action',
    sourceTabId: tab.id,
    sourceTabIndex: tab.index
  });

  if (session.searchMode === 'url') {
    await showNotification({
      messageId: (await isMobile())
        ? 'error_invalidSearchModeMobile_url'
        : 'error_invalidSearchMode_url'
    });
    return;
  }

  const enabledEngines = await getEnabledEngines(session.options);

  if (!enabledEngines.length) {
    await showNotification({messageId: 'error_allEnginesDisabled'});
    return;
  }

  if (
    session.options.searchAllEnginesAction === 'main' &&
    enabledEngines.length > 1
  ) {
    session.engineGroup = 'allEngines';
    session.engines = enabledEngines;
  } else {
    session.engines.push(enabledEngines[0]);
  }

  onActionClick(session, tab.url);
}

async function onActionPopupClick(engine, docUrl) {
  const tab = await getActiveTab();

  const session = await createSession({
    sessionOrigin: 'action',
    sourceTabId: tab.id,
    sourceTabIndex: tab.index,
    engine
  });

  onActionClick(session, docUrl || tab.url);
}

async function setContextMenu() {
  // removes context menu items from all instances
  await browser.contextMenus.removeAll();

  const {showInContextMenu} = await storage.get('showInContextMenu');
  if (showInContextMenu) {
    if (['chrome', 'edge', 'opera'].includes(targetEnv)) {
      // notify all background script instances
      await storage.set({setContextMenuEvent: Date.now()});
    } else {
      await createMenu();
    }
  }
}

async function setBrowserAction() {
  const options = await storage.get([
    'engines',
    'disabledEngines',
    'searchAllEnginesAction'
  ]);
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
        'actionTitle_engine',
        getText(`engineName_${enEngines[0]}`)
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
      title: getText('actionTitle_allEngines')
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

async function showPageAction(tabId) {
  await setPageAction(tabId);
  await browser.pageAction.show(tabId);
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
  const {showPageAction} = await storage.get('showPageAction');
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
  const options = await storage.get([
    'engines',
    'disabledEngines',
    'searchAllEnginesAction'
  ]);
  const enEngines = await getEnabledEngines(options);
  const hasListener = browser.pageAction.onClicked.hasListener(onActionClick);

  if (enEngines.length === 1) {
    if (!hasListener) {
      browser.pageAction.onClicked.addListener(onActionClick);
    }
    browser.pageAction.setTitle({
      tabId,
      title: getText(
        'actionTitle_engine',
        getText(`engineName_${enEngines[0]}`)
      )
    });
    browser.pageAction.setPopup({tabId, popup: ''});
    return;
  }

  if (options.searchAllEnginesAction === 'main' && enEngines.length > 1) {
    if (!hasListener) {
      browser.pageAction.onClicked.addListener(onActionClick);
    }
    browser.pageAction.setTitle({
      tabId,
      title: getText('actionTitle_allEngines')
    });
    browser.pageAction.setPopup({tabId, popup: ''});
    return;
  }

  browser.pageAction.setTitle({tabId, title: getText('extensionName')});
  if (enEngines.length === 0) {
    if (!hasListener) {
      browser.pageAction.onClicked.addListener(onActionClick);
    }
    browser.pageAction.setPopup({tabId, popup: ''});
  } else {
    if (hasListener) {
      browser.pageAction.onClicked.removeListener(onActionClick);
    }
    browser.pageAction.setPopup({
      tabId,
      popup: '/src/action/index.html'
    });
  }
}

async function processMessage(request, sender) {
  // Samsung Internet 13: extension messages are sometimes also dispatched
  // to the sender frame.
  if (sender.url === document.URL) {
    return;
  }

  if (
    targetEnv === 'samsung' &&
    sender.tab &&
    sender.tab.id !== browser.tabs.TAB_ID_NONE
  ) {
    // Samsung Internet 13: runtime.onMessage provides wrong tab index.
    sender.tab = await browser.tabs.get(sender.tab.id);
  }

  if (request.id === 'actionPopupSubmit') {
    onActionPopupClick(request.engine, request.docUrl);
  } else if (request.id === 'notification') {
    showNotification({
      message: request.message,
      messageId: request.messageId,
      title: request.title,
      type: request.type
    });
  } else if (request.id === 'getPlatform') {
    return getPlatform({fallback: false});
  } else if (request.id === 'storageRequest') {
    const data = await registry.getStorageItem({
      storageId: request.storageId,
      saveReceipt: request.saveReceipt
    });
    if (data) {
      if (request.asyncResponse) {
        return Promise.resolve(data);
      } else {
        browser.tabs.sendMessage(
          sender.tab.id,
          {id: 'storageResponse', storageItem: data},
          {frameId: sender.frameId}
        );
      }
    }
  } else if (request.id === 'storageReceipt') {
    for (const storageId of request.storageIds) {
      await registry.saveStorageItemReceipt({storageId});
    }
  } else if (request.id === 'taskRequest') {
    const taskIndex = await registry.getTaskRegistryItem({
      tabId: sender.tab.id
    });
    if (taskIndex && Date.now() - taskIndex.addTime < 600000) {
      const task = await registry.getStorageItem({storageId: taskIndex.taskId});
      if (task && task.search.isExec) {
        execEngine(sender.tab.id, task.search.engine, taskIndex.taskId);
      }
    }
  } else if (request.id === 'optionChange') {
    await onOptionChange();
  }
}

function onMessage(request, sender, sendResponse) {
  const response = processMessage(request, sender);

  if (targetEnv === 'safari') {
    response.then(function (result) {
      // Safari 15: undefined response will cause sendMessage to never resolve.
      if (result === undefined) {
        result = null;
      }
      sendResponse(result);
    });
    return true;
  } else {
    return response;
  }
}

async function onOptionChange() {
  await setupUI();
}

async function onStorageChange(changes, area) {
  if (area === 'local' && (await isStorageReady())) {
    if (changes.setContextMenuEvent) {
      await queue.add(createMenu);
    }
  }
}

async function onAlarm({name}) {
  if (name.startsWith('delete-storage-item')) {
    const [_, storageId] = name.split('_');
    await registry.deleteStorageItem({storageId});
  }
}

async function onInstall(details) {
  if (
    ['install', 'update'].includes(details.reason) &&
    ['chrome', 'edge', 'opera', 'samsung'].includes(targetEnv)
  ) {
    await insertBaseModule();
  }
}

async function onStartup() {
  if (['samsung'].includes(targetEnv)) {
    // Samsung Internet: Content script is not always run in restored
    // active tab on startup.
    await insertBaseModule({activeTab: true});
  }
}

function addContextMenuListener() {
  if (browser.contextMenus) {
    browser.contextMenus.onClicked.addListener(onContextMenuItemClick);
  }
}

function addBrowserActionListener() {
  browser.browserAction.onClicked.addListener(onActionButtonClick);
}

function addStorageListener() {
  browser.storage.onChanged.addListener(onStorageChange);
}

function addMessageListener() {
  browser.runtime.onMessage.addListener(onMessage);
}

function addAlarmListener() {
  browser.alarms.onAlarm.addListener(onAlarm);
}

function addInstallListener() {
  browser.runtime.onInstalled.addListener(onInstall);
}

function addStartupListener() {
  // Not fired in private browsing mode.
  browser.runtime.onStartup.addListener(onStartup);
}

async function setupUI() {
  const items = [setBrowserAction];

  if (await isContextMenuSupported()) {
    items.push(setContextMenu);
  }

  if (targetEnv === 'firefox' && !(await isAndroid())) {
    items.push(setRequestListeners);
  }

  await queue.addAll(items);
}

async function setup() {
  if (!(await isStorageReady())) {
    await migrateLegacyStorage();
    await initStorage();
  }

  await setupUI();
  await registry.cleanupRegistry();
}

function init() {
  addContextMenuListener();
  addBrowserActionListener();
  addMessageListener();
  addStorageListener();
  addAlarmListener();
  addInstallListener();
  addStartupListener();

  setup();
}

init();
