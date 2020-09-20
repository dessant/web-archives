import browser from 'webextension-polyfill';
import {difference, isString} from 'lodash-es';

import storage from 'storage/storage';
import {
  getText,
  createTab,
  getActiveTab,
  isAndroid,
  getBrowser
} from 'utils/common';
import {targetEnv} from 'utils/config';
import {projectUrl} from 'utils/data';

async function getEnabledEngines(options) {
  if (typeof options === 'undefined') {
    options = await storage.get(['engines', 'disabledEngines'], 'sync');
  }
  return difference(options.engines, options.disabledEngines);
}

function showNotification({message, messageId, title, type = 'info'}) {
  if (!title) {
    title = getText('extensionName');
  }
  if (messageId) {
    message = getText(messageId);
  }
  return browser.notifications.create(`vpa-notification-${type}`, {
    type: 'basic',
    title: title,
    message: message,
    iconUrl: '/src/icons/app/icon-48.png'
  });
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
  if (!isString(url) || url.length > 2048) {
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (err) {
    return;
  }

  if (!/^(?:https?|ftp):$/i.test(parsedUrl.protocol)) {
    return;
  }

  return true;
}

function normalizeUrl(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.hash) {
    parsedUrl.hash = '';
  }

  return parsedUrl.toString();
}

async function showContributePage(action = false) {
  await storage.set({contribPageLastOpen: new Date().getTime()}, 'sync');
  const activeTab = await getActiveTab();
  let url = browser.extension.getURL('/src/contribute/index.html');
  if (action) {
    url = `${url}?action=${action}`;
  }
  await createTab(url, {index: activeTab.index + 1});
}

async function showProjectPage() {
  const activeTab = await getActiveTab();
  await createTab(projectUrl, {index: activeTab.index + 1});
}

async function isFenix() {
  if (targetEnv === 'firefox' && (await isAndroid())) {
    const {version} = await getBrowser();

    if (parseInt(version.split('.')[0], 10) > 68) {
      return true;
    }
  }
}

async function configFenix() {
  if (await isFenix()) {
    document.documentElement.classList.add('fenix');
    return true;
  }
}

export {
  getEnabledEngines,
  showNotification,
  getListItems,
  validateUrl,
  normalizeUrl,
  showContributePage,
  showProjectPage,
  configFenix
};
