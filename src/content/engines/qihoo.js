var storageKey;
var scriptKey;

function viewCache(url) {
  const nodes = document.querySelectorAll('li.res-list > p.g-linkinfo > a.m');

  const cacheNodes = [];
  const rxUrl = /^(?:https?|ftp):\/\/(.*)$/i;
  const noschUrl = url.replace(rxUrl, '$1');
  for (let node of nodes) {
    const cacheParam = new URL(node.href).searchParams.get('u');
    if (cacheParam) {
      const noschCacheParam = cacheParam.replace(rxUrl, '$1');
      if (noschCacheParam === noschUrl) {
        node.setAttribute('target', '_top');
        node.click();
        return;
      }
      if (noschCacheParam.startsWith(noschUrl)) {
        cacheNodes.push(node);
      }
    }
  }

  if (cacheNodes.length) {
    const node = cacheNodes[0];
    node.setAttribute('target', '_top');
    node.click();
  }
}

function init(request) {
  if (request.id === 'initScript') {
    viewCache(request.url);
  }
}

chrome.runtime.onMessage.addListener(init);

chrome.runtime.sendMessage({id: 'initScript', storageKey, scriptKey});
