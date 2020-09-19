var storageKey;
var scriptKey;

function viewCache() {
  const node = document.querySelector(
    'div#content_left > div.result[id="1"] div.f13 > a.m'
  );

  if (node) {
    window.location.href = node.href;
  }
}

function init(request) {
  if (request.id === 'initScript') {
    viewCache();
  }
}

chrome.runtime.onMessage.addListener(init);

chrome.runtime.sendMessage({id: 'initScript', storageKey, scriptKey});
