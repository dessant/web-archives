import _ from 'lodash';

import storage from 'storage/storage';
import {getText} from 'utils/common';

async function getEnabledEngines(options) {
  if (typeof options === 'undefined') {
    options = await storage.get(['engines', 'disabledEngines'], 'sync');
  }
  return _.difference(options.engines, options.disabledEngines);
}

function showNotification(messageId) {
  return browser.notifications.create('vpa-notification', {
    type: 'basic',
    title: getText('extensionName'),
    message: getText(messageId),
    iconUrl: '/src/icons/app/app-icon-48.png'
  });
}

module.exports = {
  getEnabledEngines,
  showNotification
};
