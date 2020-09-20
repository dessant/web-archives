var storageKey;
var scriptKey;

function viewCache() {
  const nodes = document.querySelectorAll('div.extralinks');

  for (const node of nodes) {
    const data = JSON.parse(node.dataset.bem);
    const cacheUrl = data.extralinks.copy;

    if (cacheUrl) {
      node.click();

      window.setTimeout(function () {
        const link = document.querySelector(
          '.extralinks-popup a[href^="https://yandexwebcache.net/"]'
        );
        link.setAttribute('target', '_top');
        link.click();
      }, 100);
      break;
    }
  }
}

function init(request) {
  if (request.id === 'initScript') {
    viewCache();
  }
}

if (!window.location.pathname.startsWith('/showcaptcha')) {
  chrome.runtime.onMessage.addListener(init);

  chrome.runtime.sendMessage({id: 'initScript', storageKey, scriptKey});
}
