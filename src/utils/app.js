import {difference} from 'lodash-es';

import storage from 'storage/storage';
import {
  getText,
  createTab,
  getActiveTab,
  getPlatform,
  getDayPrecisionEpoch,
  isAndroid,
  getDarkColorSchemeQuery
} from 'utils/common';
import {targetEnv, enableContributions} from 'utils/config';
import {
  engines,
  rasterEngineIcons,
  engineIconAlias,
  engineIconVariants,
  supportUrl
} from 'utils/data';

async function getEnabledEngines(options) {
  if (typeof options === 'undefined') {
    options = await storage.get(['engines', 'disabledEngines']);
  }
  return difference(options.engines, options.disabledEngines);
}

async function getSearches(targetEngines) {
  const searches = [];
  for (const engine of targetEngines) {
    const isExec = engines[engine].isExec;
    const isTaskId = engines[engine].isTaskId;
    searches.push({
      engine,
      isExec,
      isTaskId,
      sendsReceipt: isExec || isTaskId
    });
  }

  return searches;
}

async function showNotification({
  message,
  messageId,
  title,
  type = 'info',
  timeout = 0
} = {}) {
  if (!title) {
    title = getText('extensionName');
  }
  if (messageId) {
    message = getText(messageId);
  }

  if (targetEnv === 'safari') {
    return browser.runtime.sendNativeMessage('application.id', {
      id: 'notification',
      message
    });
  } else {
    const notification = await browser.notifications.create(
      `wa-notification-${type}`,
      {
        type: 'basic',
        title,
        message,
        iconUrl: '/src/assets/icons/app/icon-64.png'
      }
    );

    if (timeout) {
      window.setTimeout(() => {
        browser.notifications.clear(notification);
      }, timeout);
    }

    return notification;
  }
}

function getListItems(data, {scope = '', shortScope = ''} = {}) {
  const results = {};

  for (const [group, items] of Object.entries(data)) {
    results[group] = [];

    items.forEach(function (item) {
      if (item.value === undefined) {
        item = {value: item};
      }

      item.title = getText(`${scope ? scope + '_' : ''}${item.value}`);

      if (shortScope) {
        item.shortTitle = getText(`${shortScope}_${item.value}`);
      }

      results[group].push(item);
    });
  }

  return results;
}

async function loadFonts(fonts) {
  await Promise.allSettled(fonts.map(font => document.fonts.load(font)));
}

async function configApp(app) {
  const platform = await getPlatform();

  const classes = [platform.targetEnv, platform.os];
  document.documentElement.classList.add(...classes);

  if (app) {
    app.config.globalProperties.$env = platform;
  }
}

function processMessageResponse(response, sendResponse) {
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

function validateUrl(url) {
  try {
    if (url.length > 2048) {
      return;
    }

    const parsedUrl = new URL(url);

    if (/^(?:https?|ftp):$/i.test(parsedUrl.protocol)) {
      return true;
    }
  } catch (err) {}
}

function normalizeUrl(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.hash) {
    parsedUrl.hash = '';
  }

  return parsedUrl.toString();
}

async function getOpenerTabId(openerTab) {
  if (
    openerTab.id !== browser.tabs.TAB_ID_NONE &&
    !(await getPlatform()).isMobile
  ) {
    return openerTab.id;
  }

  return null;
}

async function showPage({
  url = '',
  setOpenerTab = true,
  getTab = false,
  activeTab = null
} = {}) {
  if (!activeTab) {
    activeTab = await getActiveTab();
  }

  const props = {url, index: activeTab.index + 1, active: true, getTab};

  if (setOpenerTab) {
    props.openerTabId = await getOpenerTabId(activeTab);
  }

  return createTab(props);
}

async function autoShowContributePage({
  minUseCount = 0, // 0-1000
  minInstallDays = 0,
  minLastOpenDays = 0,
  minLastAutoOpenDays = 0,
  action = 'auto',
  activeTab = null
} = {}) {
  if (enableContributions) {
    const options = await storage.get([
      'showContribPage',
      'useCount',
      'installTime',
      'contribPageLastOpen',
      'contribPageLastAutoOpen'
    ]);

    const epoch = getDayPrecisionEpoch();

    if (
      options.showContribPage &&
      options.useCount >= minUseCount &&
      epoch - options.installTime >= minInstallDays * 86400000 &&
      epoch - options.contribPageLastOpen >= minLastOpenDays * 86400000 &&
      epoch - options.contribPageLastAutoOpen >= minLastAutoOpenDays * 86400000
    ) {
      await storage.set({
        contribPageLastOpen: epoch,
        contribPageLastAutoOpen: epoch
      });

      return showContributePage({
        action,
        updateStats: false,
        activeTab,
        getTab: true
      });
    }
  }
}

let useCountLastUpdate = 0;
async function updateUseCount({
  valueChange = 1,
  maxUseCount = Infinity,
  minInterval = 0
} = {}) {
  if (Date.now() - useCountLastUpdate >= minInterval) {
    useCountLastUpdate = Date.now();

    const {useCount} = await storage.get('useCount');

    if (useCount < maxUseCount) {
      await storage.set({useCount: useCount + valueChange});
    } else if (useCount > maxUseCount) {
      await storage.set({useCount: maxUseCount});
    }
  }
}

async function processAppUse({action = 'auto', activeTab = null} = {}) {
  await updateUseCount({
    valueChange: 1,
    maxUseCount: 1000
  });

  return autoShowContributePage({
    minUseCount: 10,
    minInstallDays: 14,
    minLastOpenDays: 14,
    minLastAutoOpenDays: 365,
    activeTab,
    action
  });
}

async function showContributePage({
  action = '',
  updateStats = true,
  getTab = false,
  activeTab = null
} = {}) {
  if (updateStats) {
    await storage.set({contribPageLastOpen: getDayPrecisionEpoch()});
  }

  let url = browser.runtime.getURL('/src/contribute/index.html');
  if (action) {
    url = `${url}?action=${action}`;
  }

  return showPage({url, getTab, activeTab});
}

async function showOptionsPage({getTab = false, activeTab = null} = {}) {
  // Samsung Internet 13: runtime.openOptionsPage fails.
  // runtime.openOptionsPage adds new tab at the end of the tab list.
  return showPage({
    url: browser.runtime.getURL('/src/options/index.html'),
    getTab,
    activeTab
  });
}

async function showSupportPage({getTab = false, activeTab = null} = {}) {
  return showPage({url: supportUrl, getTab, activeTab});
}

async function hasModule({tabId, frameId = 0, module, insert = false} = {}) {
  try {
    const [isModule] = await browser.tabs.executeScript(tabId, {
      frameId,
      runAt: 'document_start',
      code: `typeof ${module}Module !== 'undefined'`
    });

    if (!isModule && insert) {
      await browser.tabs.executeScript(tabId, {
        frameId,
        runAt: 'document_start',
        file: `/src/${module}/script.js`
      });
    }

    if (isModule || insert) {
      return true;
    }
  } catch (err) {}

  return false;
}

async function insertBaseModule({activeTab = false} = {}) {
  const tabs = [];
  if (activeTab) {
    const tab = await getActiveTab();
    if (tab) {
      tabs.push(tab);
    }
  } else {
    tabs.push(
      ...(await browser.tabs.query({
        url: ['http://*/*', 'https://*/*'],
        windowType: 'normal'
      }))
    );
  }

  for (const tab of tabs) {
    browser.tabs.executeScript(tab.id, {
      allFrames: true,
      runAt: 'document_start',
      file: '/src/base/script.js'
    });
  }
}

async function isContextMenuSupported() {
  if (await isAndroid()) {
    if (targetEnv === 'samsung') {
      return true;
    }
  } else if (browser.contextMenus) {
    return true;
  }

  return false;
}

async function checkSearchEngineAccess() {
  // Check if search engine access is enabled in Opera
  if (/ opr\//i.test(navigator.userAgent)) {
    const {lastEngineAccessCheck} = await storage.get('lastEngineAccessCheck');
    // run at most once a week
    if (Date.now() - lastEngineAccessCheck > 604800000) {
      await storage.set({lastEngineAccessCheck: Date.now()});

      const url = 'https://www.google.com/generate_204';

      const hasAccess = await new Promise(resolve => {
        let access = false;

        function requestCallback() {
          access = true;
          removeCallback();
          return {cancel: true};
        }

        const removeCallback = function () {
          window.clearTimeout(timeoutId);
          browser.webRequest.onBeforeRequest.removeListener(requestCallback);

          resolve(access);
        };
        const timeoutId = window.setTimeout(removeCallback, 3000); // 3 seconds

        browser.webRequest.onBeforeRequest.addListener(
          requestCallback,
          {urls: [url], types: ['xmlhttprequest']},
          ['blocking']
        );

        fetch(url).catch(err => null);
      });

      if (!hasAccess) {
        await showNotification({messageId: 'error_noSearchEngineAccess'});
      }
    }
  }
}

function getEngineIcon(engine, {variant = ''} = {}) {
  engine = engineIconAlias[engine] || engine;

  let name = engine;
  if (variant && engineIconVariants[engine]?.includes(variant)) {
    name += `-${variant}`;
  }

  const ext = rasterEngineIcons.includes(engine) ? 'png' : 'svg';

  return `/src/assets/icons/engines/${name}.${ext}`;
}

function getEngineMenuIcon(engine, {variant = ''} = {}) {
  engine = engineIconAlias[engine] || engine;

  let name = engine;
  if (variant && engineIconVariants[engine]?.includes(variant)) {
    name += `-${variant}`;
  }

  if (rasterEngineIcons.includes(engine)) {
    return {
      16: `src/assets/icons/engines/${name}-16.png`,
      32: `src/assets/icons/engines/${name}-32.png`
    };
  } else {
    return {
      16: `src/assets/icons/engines/${name}.svg`
    };
  }
}

function isMatchingUrlHost(url, hostnames) {
  try {
    const {hostname} = new URL(url);
    if (hostnames.includes(hostname)) {
      return true;
    }
  } catch (err) {}

  return false;
}

function handleBrowserActionEscapeKey() {
  // Keep the browser action open when a menu or popup is active

  // Firefox: extensions cannot handle the Escape key event
  window.addEventListener(
    'keydown',
    ev => {
      if (ev.key === 'Escape' && document.querySelector('.v-overlay--active')) {
        ev.preventDefault();
      }
    },
    {capture: true, passive: false}
  );
}

async function getAppTheme(theme) {
  if (!theme) {
    ({appTheme: theme} = await storage.get('appTheme'));
  }

  if (theme === 'auto') {
    theme = getDarkColorSchemeQuery().matches ? 'dark' : 'light';
  }

  return theme;
}

export {
  getEnabledEngines,
  getSearches,
  showNotification,
  getListItems,
  configApp,
  loadFonts,
  processMessageResponse,
  showContributePage,
  autoShowContributePage,
  updateUseCount,
  processAppUse,
  showOptionsPage,
  showSupportPage,
  getEngineIcon,
  getEngineMenuIcon,
  validateUrl,
  normalizeUrl,
  getOpenerTabId,
  showPage,
  hasModule,
  insertBaseModule,
  isContextMenuSupported,
  checkSearchEngineAccess,
  isMatchingUrlHost,
  handleBrowserActionEscapeKey,
  getAppTheme
};
