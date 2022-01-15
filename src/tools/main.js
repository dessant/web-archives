import browser from 'webextension-polyfill';

import {validateUrl} from 'utils/app';
import {pageArchiveHosts, linkArchiveUrlRx} from 'utils/data';

function main() {
  // Script may be injected multiple times.
  if (self.toolsModule) {
    return;
  } else {
    self.toolsModule = true;
  }

  self.openCurrentDoc = async function () {
    let docUrl;
    const hostname = window.location.hostname;

    for (const [engine, hosts] of Object.entries(pageArchiveHosts)) {
      if (hosts.includes(hostname)) {
        if (engine === 'archiveOrg') {
          const baseNode = document.querySelector('#wm-ipp-base');
          if (baseNode) {
            const shadowRoot =
              chrome.dom?.openOrClosedShadowRoot(baseNode) ||
              baseNode.openOrClosedShadowRoot ||
              baseNode.shadowRoot;

            if (shadowRoot) {
              docUrl = shadowRoot.querySelector(
                '#wm-toolbar input#wmtbURL'
              )?.value;
            } else {
              docUrl = window.location.href.match(
                linkArchiveUrlRx.archiveOrg
              )?.[1];
            }
          }
        } else if (engine === 'archiveIs') {
          docUrl = document.querySelector(
            '#HEADER form[action*="/search/"] input[type=text]'
          )?.value;
        } else if (engine === 'google') {
          docUrl = document.querySelector(
            '[id*="google-cache-hdr"] > div > span > a'
          )?.href;
        } else if (engine === 'bing') {
          docUrl = document.querySelector(
            'div.b_vPanel > div > strong > a[h*="ID=SERP"]'
          )?.href;
        } else if (engine === 'yandex') {
          docUrl = document.querySelector('#yandex-cache-hdr > span > a')?.href;
        } else if (engine === 'yahooJp') {
          docUrl = new URL(window.location.href).searchParams.get('u')?.trim();
        } else if (engine === 'qihoo') {
          docUrl = new URL(window.location.href).searchParams.get('u')?.trim();
        } else if (engine === 'mailru') {
          docUrl = new URL(window.location.href).searchParams
            .get('qurl')
            ?.trim();
        }

        break;
      }
    }

    if (validateUrl(docUrl)) {
      await browser.runtime.sendMessage({id: 'createTab', url: docUrl});
    } else {
      await browser.runtime.sendMessage({
        id: 'notification',
        messageId: 'error_currentDocUrlNotFound'
      });
    }
  };
}

main();
