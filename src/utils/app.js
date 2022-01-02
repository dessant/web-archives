import browser from 'webextension-polyfill';
import {difference} from 'lodash-es';

import storage from 'storage/storage';
import {
  getText,
  createTab,
  getActiveTab,
  getPlatform,
  isAndroid
} from 'utils/common';
import {targetEnv} from 'utils/config';
import {engines, projectUrl} from 'utils/data';

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

function showNotification({message, messageId, title, type = 'info'} = {}) {
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
    return browser.notifications.create(`wa-notification-${type}`, {
      type: 'basic',
      title,
      message,
      iconUrl: '/src/assets/icons/app/icon-64.png'
    });
  }
}

function getListItems(data, {scope = '', shortScope = ''} = {}) {
  const labels = {};
  for (const [group, items] of Object.entries(data)) {
    labels[group] = [];
    items.forEach(function (value) {
      const item = {
        id: value,
        label: getText(`${scope ? scope + '_' : ''}${value}`)
      };
      if (shortScope) {
        item.shortLabel = getText(`${shortScope}_${value}`);
      }
      labels[group].push(item);
    });
  }
  return labels;
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

async function showContributePage(action = '') {
  await storage.set({contribPageLastOpen: new Date().getTime()});
  const activeTab = await getActiveTab();
  let url = browser.runtime.getURL('/src/contribute/index.html');
  if (action) {
    url = `${url}?action=${action}`;
  }
  return createTab({url, index: activeTab.index + 1});
}

async function showProjectPage() {
  const activeTab = await getActiveTab();
  await createTab({url: projectUrl, index: activeTab.index + 1});
}

async function configUI(Vue) {
  const {os} = await getPlatform();

  document.documentElement.classList.add(targetEnv, os);

  if (Vue) {
    Vue.prototype.$isChrome = targetEnv === 'chrome';
    Vue.prototype.$isEdge = targetEnv === 'edge';
    Vue.prototype.$isFirefox = targetEnv === 'firefox';
    Vue.prototype.$isOpera = targetEnv === 'opera';
    Vue.prototype.$isSafari = targetEnv === 'safari';
    Vue.prototype.$isSamsung = targetEnv === 'samsung';

    Vue.prototype.$isWindows = os === 'windows';
    Vue.prototype.$isMacos = os === 'macos';
    Vue.prototype.$isLinux = os === 'linux';
    Vue.prototype.$isAndroid = os === 'android';
    Vue.prototype.$isIos = os === 'ios';
    Vue.prototype.$isIpados = os === 'ipados';

    Vue.prototype.$isMobile = ['android', 'ios', 'ipados'].includes(os);
  }
}

async function hasBaseModule(tabId, frameId = 0) {
  try {
    const [isBaseModule] = await browser.tabs.executeScript(tabId, {
      frameId,
      runAt: 'document_start',
      code: `typeof baseModule !== 'undefined'`
    });

    if (isBaseModule) {
      return true;
    }
  } catch (err) {}
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
      file: '/src/insert/script.js'
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

export {
  getEnabledEngines,
  getSearches,
  showNotification,
  getListItems,
  showContributePage,
  showProjectPage,
  validateUrl,
  normalizeUrl,
  configUI,
  hasBaseModule,
  insertBaseModule,
  isContextMenuSupported,
  checkSearchEngineAccess
};
