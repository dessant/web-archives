import {v4 as uuidv4} from 'uuid';
import Queue from 'p-queue';

import {initStorage} from 'storage/init';
import {isStorageReady, encodeStorageData} from 'storage/storage';
import storage from 'storage/storage';
import {
  getEnabledEngines,
  getSearches,
  showNotification,
  validateUrl,
  normalizeUrl,
  showPage,
  hasModule,
  insertBaseModule,
  processMessageResponse,
  processAppUse,
  setAppVersion,
  getStartupState,
  getNetRequestRuleIds,
  isContextMenuSupported,
  checkSearchEngineAccess,
  getEngineMenuIcon,
  getAppTheme,
  addTabRevision
} from 'utils/app';
import {
  getText,
  executeScript,
  createTab,
  getNewTabUrl,
  isAndroid,
  isMobile,
  getActiveTab,
  getPlatform,
  isValidTab,
  isIndexedDbSupported,
  runOnce
} from 'utils/common';
import {getScriptFunction} from 'utils/scripts';
import registry from 'utils/registry';
import {
  optionKeys,
  engines,
  errorCodes,
  archiveOrgHosts,
  archiveIsHosts,
  pageArchiveHosts,
  linkArchiveHosts,
  linkArchiveUrlRx,
  chromeDesktopUA
} from 'utils/data';
import {targetEnv, mv3} from 'utils/config';

const queue = new Queue({concurrency: 1});

async function setUserAgentHeader(tabId, userAgent) {
  if (mv3) {
    const ruleIds = getNetRequestRuleIds();

    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: ruleIds,
      addRules: [
        {
          id: ruleIds[0],
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {header: 'User-Agent', operation: 'set', value: userAgent}
            ]
          },
          condition: {
            tabIds: [tabId],
            resourceTypes: [
              'font',
              'image',
              'main_frame',
              'media',
              'ping',
              'script',
              'stylesheet',
              'sub_frame',
              'websocket',
              'xmlhttprequest',
              'other'
            ]
          }
        }
      ]
    });
  } else {
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
}

async function createMenuItem(item) {
  return new Promise((resolve, reject) => {
    let menuItemId;

    function callback() {
      if (browser.runtime.lastError) {
        reject(browser.runtime.lastError);
      }

      resolve(menuItemId);
    }

    // creates context menu item for current instance
    menuItemId = browser.contextMenus.create(item, callback);
  });
}

async function removeMenuItem(menuItemId, {throwError = false} = {}) {
  // Safari 18: contextMenus.remove crashes the extension process
  // when the menu item to be removed was created from a previous instance
  // of a non-persistent background page.

  try {
    // removes context menu item from current instance
    await browser.contextMenus.remove(menuItemId);
  } catch (err) {
    if (throwError) {
      throw err;
    }
  }
}

async function removeAllMenuItems() {
  // removes context menu items from all instances
  await browser.contextMenus.removeAll();
}

async function createMenu() {
  const context = {
    name: 'private',
    active: browser.extension.inIncognitoContext
  };

  if (['chrome', 'edge', 'opera'].includes(targetEnv)) {
    const {menuItems: currentItems} = await storage.get('menuItems', {context});

    for (const itemId of currentItems) {
      await removeMenuItem(itemId);
    }
  } else {
    await removeAllMenuItems();
  }

  const {showInContextMenu} = await storage.get('showInContextMenu');
  const newItems = showInContextMenu !== 'false' ? await getMenuItems() : [];

  await storage.set({menuItems: newItems.map(item => item.id)}, {context});

  try {
    for (const item of newItems) {
      await createMenuItem(item);
    }
  } catch (err) {
    // The storage may have been cleared, and the context menu state is
    // no longer known. All menu items are removed and the menu is recreated.

    await removeAllMenuItems();

    for (const item of newItems) {
      await createMenuItem(item);
    }

    if (runOnce('createMenuError')) {
      await dispatchMenuChangeEvent();
    }

    throw err;
  }
}

async function dispatchMenuChangeEvent() {
  if (['chrome', 'edge', 'opera'].includes(targetEnv)) {
    // notify the other background script instance
    await storage.set(
      {menuChangeEvent: Date.now()},
      {
        area: mv3 ? 'session' : 'local',
        context: {
          name: 'private',
          active: !browser.extension.inIncognitoContext
        }
      }
    );
  }
}

async function getMenuItem({
  id,
  title = '',
  contexts,
  parent,
  type = 'normal',
  documentUrlPatterns,
  targetUrlPatterns,
  icons
}) {
  const params = {
    id,
    title,
    contexts,
    parentId: parent,
    type
  };

  if (browser.extension.inIncognitoContext) {
    params.id += '_private';
  }

  if (documentUrlPatterns) {
    params.documentUrlPatterns = documentUrlPatterns;
  }
  if (targetUrlPatterns) {
    params.targetUrlPatterns = targetUrlPatterns;
  }
  if (icons) {
    params.icons = icons;
  }

  return params;
}

async function getMenuItems() {
  const env = await getPlatform();

  const options = await storage.get(optionKeys);

  const contexts = ['link', 'selection'];
  if (options.showInContextMenu === 'all') {
    contexts.push('audio', 'editable', 'frame', 'image', 'video');

    if (env.isFirefox) {
      contexts.push('password');
    }
    if (!env.isAndroid) {
      contexts.push('page');
    }
  }

  const setIcons = env.isFirefox && options.showEngineIcons;

  let theme;
  if (setIcons) {
    theme = await getAppTheme(options.appTheme);
  }

  const searchAllEngines =
    !env.isSamsung && options.searchAllEnginesContextMenu;

  const enEngines = await getEnabledEngines(options);

  const items = [];

  if (enEngines.length === 1) {
    const engine = enEngines[0];

    items.push(
      await getMenuItem({
        id: `search_${enEngines[0]}_1`,
        title: getText(
          'mainMenuItemTitle_engine',
          getText(`menuItemTitle_${engine}`)
        ),
        contexts
      })
    );
  } else if (enEngines.length > 1 && searchAllEngines === 'main') {
    items.push(
      await getMenuItem({
        id: 'search_allEngines_1',
        title: getText('mainMenuItemTitle_allEngines'),
        contexts
      })
    );
  } else if (enEngines.length > 1) {
    if (options.openCurrentDocContextMenu) {
      const currentDocDocumentUrlPatterns = Object.values(pageArchiveHosts)
        .map(hosts => hosts.map(host => `*://${host}/*`))
        .flat();
      const currentDocTargetUrlPatterns = Object.values(linkArchiveHosts)
        .map(hosts => hosts.map(host => `*://${host}/*`))
        .flat();

      items.push(
        await getMenuItem({
          id: 'openCurrentDoc_1',
          title: getText('menuItemTitle_openCurrentDoc'),
          contexts,
          documentUrlPatterns: currentDocDocumentUrlPatterns,
          targetUrlPatterns: currentDocTargetUrlPatterns
        })
      );

      if (!env.isSamsung) {
        // Samsung Internet: separator not visible, creates gap that responds to input.
        items.push(
          await getMenuItem({
            id: 'sep_1',
            contexts,
            type: 'separator',
            documentUrlPatterns: currentDocDocumentUrlPatterns,
            targetUrlPatterns: currentDocTargetUrlPatterns
          })
        );
      }
    }

    if (searchAllEngines === 'sub') {
      items.push(
        await getMenuItem({
          id: 'search_allEngines_1',
          title: getText('menuItemTitle_allEngines'),
          contexts,

          icons: setIcons && getEngineMenuIcon('allEngines', {variant: theme})
        })
      );

      if (!env.isSamsung) {
        // Samsung Internet: separator not visible, creates gap that responds to input.
        items.push(
          await getMenuItem({
            id: 'sep_2',
            contexts,
            type: 'separator'
          })
        );
      }
    }

    for (const engine of enEngines) {
      const title = getText(`menuItemTitle_${engine}`);
      const icons = setIcons && getEngineMenuIcon(engine, {variant: theme});

      items.push(
        await getMenuItem({
          id: `search_${engine}_1`,
          title,
          contexts,
          icons
        })
      );
    }
  }

  return items;
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
  } else if (engine === 'webcite') {
    tabUrl = tabUrl.replace('{date}', new Date().toISOString().split('T')[0]);
  } else if (['archiveOrg', 'archiveOrgAll'].includes(engine)) {
    const host = archiveOrgHosts[session.options.archiveOrgHost];
    tabUrl = tabUrl.replace('{host}', host);
  } else if (['archiveIs', 'archiveIsAll'].includes(engine)) {
    const host = archiveIsHosts[session.options.archiveIsHost];
    tabUrl = tabUrl.replace('{host}', host);

    if (session.options.archiveIsHost.startsWith('onion_')) {
      tabUrl = tabUrl.replace(/^https/i, 'http');
    }
  }

  archiveOrgHosts, archiveIsHosts;

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
    await showNotification({messageId: 'error_invalidPageUrl'});
    return;
  }

  let tabActive = firstBatchItem;
  let contributePageTabId;

  if (firstBatchItem) {
    const contribPageTab = await processAppUse();

    if (contribPageTab) {
      contributePageTabId = contribPageTab.id;
      session.sourceTabIndex = contribPageTab.index;
      tabActive = false;
    }
  }

  tabActive = !session.options.tabInBackgound && tabActive;

  const searches = await getSearches(session.engines);

  const receiptSearches = searches.filter(item => item.sendsReceipt);

  const docStorageArea = isIndexedDbSupported() ? 'indexeddb' : 'local';

  let docId;
  if (receiptSearches.length) {
    docId = await registry.addStorageItem(doc, {
      receipts: {expected: receiptSearches.length, received: 0},
      expiryTime: 10.0,
      area: docStorageArea
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
  const beaconToken = targetEnv === 'samsung' ? uuidv4() : '';

  const tabUrl = await getTabUrl(session, search, doc, taskId);

  const setupSteps = [];

  const userAgent = await getRequiredUserAgent(search.engine);
  if (userAgent) {
    setupSteps.push({id: 'setUserAgent', tabUrl, userAgent, beaconToken});
  }

  if (search.sendsReceipt) {
    setupSteps.push({id: 'addTask', taskId});
  }

  const storageItem = {
    tabUrl: beaconToken ? getNewTabUrl(beaconToken) : tabUrl,
    keepHistory: false
  };

  if (setupSteps.length) {
    storageItem.setupSteps = setupSteps;
  }

  await registry.addStorageItem(storageItem, {
    receipts: {expected: 1, received: 0},
    expiryTime: 1.0,
    token
  });

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

  await createTab({token, index: session.sourceTabIndex, active: tabActive});
}

async function setupTab(sender, steps) {
  const results = {};

  for (const step of steps) {
    if (step.id === 'setUserAgent') {
      await setTabUserAgent({
        tabId: sender.tab.id,
        tabUrl: step.tabUrl,
        userAgent: step.userAgent,
        beaconToken: step.beaconToken
      });

      results[step.id] = '';
    } else if (step.id === 'addTask') {
      await registry.addTaskRegistryItem({
        taskId: step.taskId,
        tabId: sender.tab.id
      });

      results[step.id] = '';
    }
  }

  return results;
}

async function setTabUserAgent({tabId, tabUrl, userAgent, beaconToken} = {}) {
  if (targetEnv === 'samsung') {
    // Samsung Internet 13: webRequest listener filtering by tab ID
    // provided by tabs.createTab returns requests from different tab.

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
    await setUserAgentHeader(tabId, userAgent);
  }
}

async function getRequiredUserAgent(engine) {
  if (await isMobile()) {
    if (['yandex'].includes(engine)) {
      return chromeDesktopUA;
    }
  }
}

async function execEngine(tabId, engine, taskId) {
  await executeScript({
    func: taskId => (self.taskId = taskId),
    args: [taskId],
    code: `self.taskId = '${taskId}'`,
    tabId
  });
  await executeScript({files: ['/src/commons-engine/script.js'], tabId});
  await executeScript({files: [`/src/engines/${engine}/script.js`], tabId});
}

async function openCurrentDoc({linkUrl} = {}) {
  if (linkUrl) {
    let docUrl;

    for (const [engine, rx] of Object.entries(linkArchiveUrlRx)) {
      const match = linkUrl.match(rx);
      if (match) {
        docUrl = match[1].trim();

        if (
          ['permacc', 'ghostarchive'].includes(engine) &&
          !/^(?:https?|ftp):\/\//i.test(docUrl)
        ) {
          docUrl = `https://${docUrl}`;
        }

        break;
      }
    }

    if (validateUrl(docUrl)) {
      return showPage({url: docUrl});
    } else {
      await showNotification({messageId: 'error_currentDocUrlNotFound'});
    }
  } else {
    const activeTab = await getActiveTab();

    if (await hasModule({tabId: activeTab.id, module: 'tools', insert: true})) {
      await executeScript({
        func: () => self.openCurrentDoc(),
        code: `self.openCurrentDoc()`,
        tabId: activeTab.id
      });
    } else {
      await showNotification({messageId: 'error_scriptsNotAllowed'});
    }
  }
}

async function onContextMenuItemClick(info, tab) {
  if (targetEnv === 'samsung' && (await isValidTab({tab}))) {
    // Samsung Internet 13: contextMenus.onClicked provides wrong tab index.
    tab = await browser.tabs.get(tab.id);
  }

  const [sessionType, engine] = info.menuItemId.split('_');

  if (sessionType === 'openCurrentDoc') {
    await openCurrentDoc({linkUrl: info.linkUrl});
    return;
  }

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

  initSearch(session, {
    docUrl:
      (validateUrl(info.selectionText) && info.selectionText) ||
      info.linkUrl ||
      info.pageUrl
  });
}

async function onActionClick(session, docUrl) {
  initSearch(session, {docUrl});
}

async function onActionButtonClick(tab) {
  if (targetEnv === 'samsung' && (await isValidTab({tab}))) {
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
  await createMenu();

  await dispatchMenuChangeEvent();
}

async function setBrowserAction() {
  const options = await storage.get([
    'engines',
    'disabledEngines',
    'searchAllEnginesAction'
  ]);
  const enEngines = await getEnabledEngines(options);

  const action = mv3 ? browser.action : browser.browserAction;

  if (enEngines.length === 1) {
    action.setTitle({
      title: getText(
        'actionTitle_engine',
        getText(`engineName_${enEngines[0]}`)
      )
    });
    action.setPopup({popup: ''});
    return;
  }

  if (options.searchAllEnginesAction === 'main' && enEngines.length > 1) {
    action.setTitle({
      title: getText('actionTitle_allEngines')
    });
    action.setPopup({popup: ''});
    return;
  }

  action.setTitle({title: getText('extensionName')});
  if (enEngines.length === 0) {
    action.setPopup({popup: ''});
  } else {
    action.setPopup({popup: '/src/action/index.html'});
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
  const hasListener =
    browser.pageAction.onClicked.hasListener(onActionButtonClick);

  if (enEngines.length === 1) {
    if (!hasListener) {
      browser.pageAction.onClicked.addListener(onActionButtonClick);
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
      browser.pageAction.onClicked.addListener(onActionButtonClick);
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
      browser.pageAction.onClicked.addListener(onActionButtonClick);
    }
    browser.pageAction.setPopup({tabId, popup: ''});
  } else {
    if (hasListener) {
      browser.pageAction.onClicked.removeListener(onActionButtonClick);
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
  if (sender.url === self.location.href) {
    return;
  }

  if (targetEnv === 'samsung') {
    if (
      /^internet-extension:\/\/.*\/src\/action\/index.html/.test(
        sender.tab?.url
      )
    ) {
      // Samsung Internet 18: runtime.onMessage provides sender.tab
      // when the message is sent from the browser action,
      // and tab.id refers to a nonexistent tab.
      sender.tab = null;
    }

    if (await isValidTab({tab: sender.tab})) {
      // Samsung Internet 13: runtime.onMessage provides wrong tab index.
      sender.tab = await browser.tabs.get(sender.tab.id);
    }
  }

  if (request.id === 'actionPopupSubmit') {
    onActionPopupClick(request.engine, request.docUrl);
  }
  if (request.id === 'openCurrentDoc') {
    openCurrentDoc();
  } else if (request.id === 'notification') {
    showNotification({
      message: request.message,
      messageId: request.messageId,
      title: request.title,
      type: request.type
    });
  } else if (request.id === 'getPlatform') {
    return getPlatform();
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
  } else if (request.id === 'showPage') {
    await showPage({url: request.url});
  } else if (request.id === 'setupTab') {
    return setupTab(sender, request.steps);
  } else if (request.id === 'executeScript') {
    const params = request.params;
    if (request.setSenderTabId) {
      params.tabId = sender.tab.id;
    }
    if (request.setSenderFrameId) {
      params.frameIds = [sender.frameId];
    }

    if (params.func) {
      params.func = getScriptFunction(params.func);
    }

    return executeScript(params);
  }
}

function onMessage(request, sender, sendResponse) {
  const response = processMessage(request, sender);

  return processMessageResponse(response, sendResponse);
}

async function onOptionChange() {
  await setupUI();
}

async function onStorageChange(changes, area) {
  if (await isStorageReady({area: mv3 ? 'session' : 'local'})) {
    const menuChangeEvent = encodeStorageData('menuChangeEvent', {
      name: 'private',
      active: browser.extension.inIncognitoContext
    });

    if (changes[menuChangeEvent]?.newValue) {
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
  if (['install', 'update'].includes(details.reason)) {
    await setup({event: 'install'});
  }
}

async function onStartup() {
  await setup({event: 'startup'});
}

async function onTabReplaced(addedTabId, removedTabId) {
  await addTabRevision({addedTabId, removedTabId});
}

function addContextMenuListener() {
  if (browser.contextMenus) {
    browser.contextMenus.onClicked.addListener(onContextMenuItemClick);
  }
}

function addActionListener() {
  if (mv3) {
    browser.action.onClicked.addListener(onActionButtonClick);
  } else {
    browser.browserAction.onClicked.addListener(onActionButtonClick);
  }
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
  browser.runtime.onStartup.addListener(onStartup);
}

function addTabReplacedListener() {
  // Safari 18: tab.id changes when an extension page is redirected
  // to a website, changes are saved to assign tasks to the correct tab.
  if (['safari'].includes(targetEnv)) {
    browser.tabs.onReplaced.addListener(onTabReplaced);
  }
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

async function setup({event = ''} = {}) {
  const startup = await getStartupState({event});

  if (startup.setupInstance) {
    await runOnce('setupInstance', async () => {
      if (!(await isStorageReady())) {
        await initStorage({data: startup});
      }

      if (['chrome', 'edge', 'opera', 'samsung'].includes(targetEnv)) {
        await insertBaseModule();
      }

      if (startup.update) {
        await setAppVersion();
      }
    });
  }

  if (startup.setupSession) {
    await runOnce('setupSession', async () => {
      if (mv3 && !(await isStorageReady({area: 'session'}))) {
        await initStorage({area: 'session', silent: true});
      }

      if (['samsung'].includes(targetEnv) && !startup.setupInstance) {
        // Samsung Internet: Content script does not always run in restored
        // active tab on startup.
        await insertBaseModule({activeTab: true});
      }

      await setupUI();
      await registry.cleanupRegistry();
    });
  }
}

function init() {
  addContextMenuListener();
  addActionListener();
  addMessageListener();
  addStorageListener();
  addAlarmListener();
  addInstallListener();
  addStartupListener();
  addTabReplacedListener();

  setup();
}

init();
