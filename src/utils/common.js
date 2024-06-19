import {v4 as uuidv4} from 'uuid';

import storage from 'storage/storage';
import {getScriptFunction} from 'utils/scripts';
import {targetEnv, mv3} from 'utils/config';

function getText(messageName, substitutions) {
  return browser.i18n.getMessage(messageName, substitutions);
}

async function executeScript({
  files = null,
  func = null,
  args = null,
  tabId = null,
  frameIds = [0],
  allFrames = false,
  world = 'ISOLATED',
  injectImmediately = true,
  unwrapResults = true,

  code = ''
}) {
  if (mv3) {
    const params = {target: {tabId, allFrames}, world};

    if (!allFrames) {
      params.target.frameIds = frameIds;
    }

    if (files) {
      params.files = files;
    } else {
      params.func = func;

      if (args) {
        params.args = args;
      }
    }

    if (targetEnv !== 'safari') {
      params.injectImmediately = injectImmediately;
    }

    const results = await browser.scripting.executeScript(params);

    if (unwrapResults) {
      return results.map(item => item.result);
    } else {
      return results;
    }
  } else {
    const params = {frameId: frameIds[0]};

    if (files) {
      params.file = files[0];
    } else {
      params.code = code;
    }

    if (injectImmediately) {
      params.runAt = 'document_start';
    }

    return browser.tabs.executeScript(tabId, params);
  }
}

function executeScriptMainContext({
  files = null,
  func = null,
  args = null,
  allFrames = false,
  injectImmediately = true,

  onLoadCallback = null,
  setNonce = true
} = {}) {
  // Must be called from a content script, `args[0]` must be a trusted string in MV2.
  if (mv3) {
    return browser.runtime.sendMessage({
      id: 'executeScript',
      setSenderTabId: true,
      setSenderFrameId: true,
      params: {files, func, args, allFrames, world: 'MAIN', injectImmediately}
    });
  } else {
    if (allFrames) {
      throw new Error('Executing code in all frames is not supported in MV2.');
    }

    let nonce;
    if (setNonce && ['firefox', 'safari'].includes(targetEnv)) {
      const nonceNode = document.querySelector('script[nonce]');
      if (nonceNode) {
        nonce = nonceNode.nonce;
      }
    }

    const script = document.createElement('script');
    if (nonce) {
      script.nonce = nonce;
    }

    if (files) {
      script.onload = function (ev) {
        ev.target.remove();

        if (onLoadCallback) {
          onLoadCallback();
        }
      };

      script.src = files[0];
      document.documentElement.appendChild(script);
    } else {
      const string = `(${getScriptFunction(func).toString()})${args ? `("${args[0]}")` : '()'}`;

      script.textContent = string;
      document.documentElement.appendChild(script);

      script.remove();

      if (onLoadCallback) {
        onLoadCallback();
      }
    }
  }
}

async function createTab({
  url = '',
  token = '',
  index = null,
  active = true,
  openerTabId = null,
  getTab = false
} = {}) {
  if (!url) {
    url = getNewTabUrl(token);
  }

  const props = {url, active};

  if (index !== null) {
    props.index = index;
  }
  if (openerTabId !== null) {
    props.openerTabId = openerTabId;
  }

  let tab = await browser.tabs.create(props);

  if (getTab) {
    if (targetEnv === 'samsung') {
      // Samsung Internet 13: tabs.create returns previously active tab.
      // Samsung Internet 13: tabs.query may not immediately return newly created tabs.
      let count = 1;
      while (count <= 500 && (!tab || tab.url !== url)) {
        [tab] = await browser.tabs.query({lastFocusedWindow: true, url});

        await sleep(20);
        count += 1;
      }
    }

    return tab;
  }
}

function getNewTabUrl(token) {
  if (!token) {
    token = uuidv4();
  }

  return `${browser.runtime.getURL('/src/tab/index.html')}?id=${token}`;
}

async function getActiveTab() {
  const [tab] = await browser.tabs.query({
    lastFocusedWindow: true,
    active: true
  });
  return tab;
}

async function isValidTab({tab, tabId = null} = {}) {
  if (!tab && tabId !== null) {
    tab = await browser.tabs.get(tabId).catch(err => null);
  }

  if (tab && tab.id !== browser.tabs.TAB_ID_NONE) {
    return true;
  }
}

let platformInfo;
async function getPlatformInfo() {
  if (platformInfo) {
    return platformInfo;
  }

  if (mv3) {
    ({platformInfo} = await storage.get('platformInfo', {area: 'session'}));
  } else {
    try {
      platformInfo = JSON.parse(window.sessionStorage.getItem('platformInfo'));
    } catch (err) {}
  }

  if (!platformInfo) {
    let os, arch;

    if (targetEnv === 'samsung') {
      // Samsung Internet 13: runtime.getPlatformInfo fails.
      os = 'android';
      arch = '';
    } else if (targetEnv === 'safari') {
      // Safari: runtime.getPlatformInfo returns 'ios' on iPadOS.
      ({os, arch} = await browser.runtime.sendNativeMessage('application.id', {
        id: 'getPlatformInfo'
      }));
    } else {
      ({os, arch} = await browser.runtime.getPlatformInfo());
    }

    platformInfo = {os, arch};

    if (mv3) {
      await storage.set({platformInfo}, {area: 'session'});
    } else {
      try {
        window.sessionStorage.setItem(
          'platformInfo',
          JSON.stringify(platformInfo)
        );
      } catch (err) {}
    }
  }

  return platformInfo;
}

async function getPlatform() {
  if (!isBackgroundPageContext()) {
    return browser.runtime.sendMessage({id: 'getPlatform'});
  }

  let {os, arch} = await getPlatformInfo();

  if (os === 'win') {
    os = 'windows';
  } else if (os === 'mac') {
    os = 'macos';
  }

  if (['x86-32', 'i386'].includes(arch)) {
    arch = '386';
  } else if (['x86-64', 'x86_64'].includes(arch)) {
    arch = 'amd64';
  } else if (arch.startsWith('arm')) {
    arch = 'arm';
  }

  const isWindows = os === 'windows';
  const isMacos = os === 'macos';
  const isLinux = os === 'linux';
  const isAndroid = os === 'android';
  const isIos = os === 'ios';
  const isIpados = os === 'ipados';

  const isMobile = ['android', 'ios', 'ipados'].includes(os);

  const isChrome = targetEnv === 'chrome';
  const isEdge =
    ['chrome', 'edge'].includes(targetEnv) &&
    /\sedg(?:e|a|ios)?\//i.test(navigator.userAgent);
  const isFirefox = targetEnv === 'firefox';
  const isOpera =
    ['chrome', 'opera'].includes(targetEnv) &&
    /\sopr\//i.test(navigator.userAgent);
  const isSafari = targetEnv === 'safari';
  const isSamsung = targetEnv === 'samsung';

  return {
    os,
    arch,
    targetEnv,
    isWindows,
    isMacos,
    isLinux,
    isAndroid,
    isIos,
    isIpados,
    isMobile,
    isChrome,
    isEdge,
    isFirefox,
    isOpera,
    isSafari,
    isSamsung
  };
}

async function isAndroid() {
  return (await getPlatform()).isAndroid;
}

async function isMobile() {
  return (await getPlatform()).isMobile;
}

function getDarkColorSchemeQuery() {
  return window.matchMedia('(prefers-color-scheme: dark)');
}

function getDayPrecisionEpoch(epoch) {
  if (!epoch) {
    epoch = Date.now();
  }

  return epoch - (epoch % 86400000);
}

function isBackgroundPageContext() {
  const backgroundUrl = mv3
    ? browser.runtime.getURL('/src/background/script.js')
    : browser.runtime.getURL('/src/background/index.html');

  return self.location.href === backgroundUrl;
}

function getExtensionDomain() {
  try {
    const {hostname} = new URL(
      browser.runtime.getURL('/src/background/script.js')
    );

    return hostname;
  } catch (err) {}

  return null;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function querySelectorXpath(selector, {rootNode = null} = {}) {
  rootNode = rootNode || document;

  return document.evaluate(
    selector,
    rootNode,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

function nodeQuerySelector(
  selector,
  {rootNode = null, selectorType = 'css'} = {}
) {
  rootNode = rootNode || document;

  return selectorType === 'css'
    ? rootNode.querySelector(selector)
    : querySelectorXpath(selector, {rootNode});
}

function findNode(
  selector,
  {
    timeout = 60000,
    throwError = true,
    observerOptions = null,
    rootNode = null,
    selectorType = 'css'
  } = {}
) {
  return new Promise((resolve, reject) => {
    rootNode = rootNode || document;

    const el = nodeQuerySelector(selector, {rootNode, selectorType});
    if (el) {
      resolve(el);
      return;
    }

    const observer = new MutationObserver(function (mutations, obs) {
      const el = nodeQuerySelector(selector, {rootNode, selectorType});
      if (el) {
        obs.disconnect();
        window.clearTimeout(timeoutId);
        resolve(el);
      }
    });

    const options = {
      childList: true,
      subtree: true
    };
    if (observerOptions) {
      Object.assign(options, observerOptions);
    }

    observer.observe(rootNode, options);

    const timeoutId = window.setTimeout(function () {
      observer.disconnect();

      if (throwError) {
        reject(new Error(`DOM node not found: ${selector}`));
      } else {
        resolve();
      }
    }, timeout);
  });
}

async function processNode(
  selector,
  actionFn,
  {
    timeout = 60000,
    throwError = true,
    observerOptions = null,
    rootNode = null,
    selectorType = 'css',
    reprocess = false
  } = {}
) {
  rootNode = rootNode || document;

  let node = await findNode(selector, {
    timeout,
    throwError,
    observerOptions,
    rootNode,
    selectorType
  });

  if (reprocess) {
    const observer = new MutationObserver(function (mutations, obs) {
      const el = nodeQuerySelector(selector, {rootNode, selectorType});
      if (el && !el.isSameNode(node)) {
        node = el;
        actionFn(node);
      }
    });

    const options = {
      childList: true,
      subtree: true
    };
    if (observerOptions) {
      Object.assign(options, observerOptions);
    }

    observer.observe(rootNode, options);

    window.setTimeout(function () {
      observer.disconnect();
    }, timeout);
  }

  return actionFn(node);
}

function waitForDocumentLoad() {
  return new Promise(resolve => {
    function checkState() {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        document.addEventListener('readystatechange', checkState, {once: true});
      }
    }

    checkState();
  });
}

function makeDocumentVisible() {
  const eventName = uuidv4();

  function dispatchVisibilityState() {
    document.dispatchEvent(
      new CustomEvent(eventName, {detail: document.visibilityState})
    );
  }

  document.addEventListener('visibilitychange', dispatchVisibilityState, {
    capture: true
  });

  executeScriptMainContext({func: 'makeDocumentVisible', args: [eventName]});
}

function getStore(name, {content = null} = {}) {
  name = `${name}Store`;

  if (!self[name]) {
    self[name] = content || {};
  }

  return self[name];
}

function runOnce(name, func) {
  const store = getStore('run');

  if (!store[name]) {
    store[name] = true;

    if (!func) {
      return true;
    }

    return func();
  }
}

function sleep(ms) {
  return new Promise(resolve => self.setTimeout(resolve, ms));
}

export {
  getText,
  executeScript,
  executeScriptMainContext,
  createTab,
  getNewTabUrl,
  getActiveTab,
  isValidTab,
  getPlatformInfo,
  getPlatform,
  isAndroid,
  isMobile,
  getDarkColorSchemeQuery,
  getDayPrecisionEpoch,
  isBackgroundPageContext,
  getExtensionDomain,
  getRandomInt,
  querySelectorXpath,
  nodeQuerySelector,
  findNode,
  processNode,
  waitForDocumentLoad,
  makeDocumentVisible,
  getStore,
  runOnce,
  sleep
};
