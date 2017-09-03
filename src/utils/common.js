import browser from 'webextension-polyfill';

const getText = browser.i18n.getMessage;

function createTab(url, index, active = true) {
  const props = {url: url, active: active};
  if (typeof index !== 'undefined') {
    props['index'] = index;
  }
  return browser.tabs.create(props);
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

function onComplete(n) {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  }
}

module.exports = {
  getText,
  createTab,
  executeCode,
  executeFile,
  onComplete
};
