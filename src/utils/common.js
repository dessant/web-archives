import browser from 'webextension-polyfill';
import {v4 as uuidv4} from 'uuid';

import {targetEnv} from 'utils/config';

const getText = browser.i18n.getMessage;

function onComplete() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTab({
  url = '',
  token = '',
  index = null,
  active = true,
  openerTabId = null
} = {}) {
  if (!url) {
    url = getNewTabUrl(token);
  }

  const props = {url, active};
  if (index !== null) {
    props.index = index;
  }
  if (
    openerTabId !== null &&
    openerTabId !== browser.tabs.TAB_ID_NONE &&
    !(await isAndroid())
  ) {
    props.openerTabId = openerTabId;
  }

  let tab = await browser.tabs.create(props);

  if (targetEnv === 'samsung' && index !== null) {
    // Samsung Internet 13: tabs.create returns previously active tab.

    // Samsung Internet 13: tabs.query may not immediately return previously created tabs.
    let count = 0;
    while (count < 100 && (!tab || tab.url !== url || tab.index !== index)) {
      [tab] = await browser.tabs.query({
        lastFocusedWindow: true,
        index
      });

      await sleep(20);
      count += 1;
    }
  }

  return tab;
}

function getNewTabUrl(token) {
  if (!token) {
    token = uuidv4();
  }

  return `${browser.runtime.getURL('/src/tab/index.html')}?id=${token}`;
}

function executeCode(string, tabId, frameId = 0, runAt = 'document_start') {
  return browser.tabs.executeScript(tabId, {
    frameId: frameId,
    runAt: runAt,
    code: string
  });
}

function executeFile(file, tabId, frameId = 0, runAt = 'document_start') {
  return browser.tabs.executeScript(tabId, {
    frameId: frameId,
    runAt: runAt,
    file: file
  });
}

function findNode(
  selector,
  {
    timeout = 60000,
    throwError = true,
    observerOptions = null,
    rootNode = null
  } = {}
) {
  return new Promise((resolve, reject) => {
    rootNode = rootNode || document;

    const el = rootNode.querySelector(selector);
    if (el) {
      resolve(el);
      return;
    }

    const observer = new MutationObserver(function (mutations, obs) {
      const el = rootNode.querySelector(selector);
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
    reprocess = false
  } = {}
) {
  rootNode = rootNode || document;

  let node = await findNode(selector, {
    timeout,
    throwError,
    observerOptions,
    rootNode
  });

  if (reprocess) {
    const observer = new MutationObserver(function (mutations, obs) {
      const el = rootNode.querySelector(selector);
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

async function getActiveTab() {
  const [tab] = await browser.tabs.query({
    lastFocusedWindow: true,
    active: true
  });
  return tab;
}

async function getPlatform({fallback = true} = {}) {
  if (targetEnv === 'samsung') {
    // Samsung Internet 13: runtime.getPlatformInfo fails.
    return {os: 'android', arch: ''};
  }

  let os, arch;
  try {
    ({os, arch} = await browser.runtime.getPlatformInfo());
  } catch (err) {
    if (fallback) {
      ({os, arch} = await browser.runtime.sendMessage({id: 'getPlatform'}));
    } else {
      throw err;
    }
  }

  if (os === 'win') {
    os = 'windows';
  } else if (os === 'mac') {
    os = 'macos';
  }

  if (
    navigator.platform === 'MacIntel' &&
    (os === 'ios' || typeof navigator.standalone !== 'undefined')
  ) {
    os = 'ipados';
  }

  if (arch === 'x86-32') {
    arch = '386';
  } else if (arch === 'x86-64') {
    arch = 'amd64';
  } else if (arch.startsWith('arm')) {
    arch = 'arm';
  }

  return {os, arch};
}

async function isAndroid() {
  const {os} = await getPlatform();
  return os === 'android';
}

async function isMobile() {
  const {os} = await getPlatform();
  return ['android', 'ios', 'ipados'].includes(os);
}

export {
  onComplete,
  getText,
  createTab,
  getNewTabUrl,
  executeCode,
  executeFile,
  isAndroid,
  isMobile,
  findNode,
  processNode,
  getActiveTab,
  getPlatform,
  sleep
};
