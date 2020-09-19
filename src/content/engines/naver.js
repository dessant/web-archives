var storageKey;
var scriptKey;

function viewCache(url) {
  const nodes = document.querySelectorAll(
    'div#main_pack li.sh_web_top a[href*="where=web_html&from=webkr"]'
  );

  const cacheUrls = [];
  const rxUrl = /^(?:https?|ftp):\/\/(.*)$/i;
  const noschUrl = url.replace(rxUrl, '$1');
  for (let node of nodes) {
    const cacheUrl = node.href;
    const cacheParam = new URL(cacheUrl).searchParams.get('u');
    if (cacheParam) {
      const noschCacheParam = cacheParam.replace(rxUrl, '$1');
      if (noschCacheParam === noschUrl) {
        window.location.href = cacheUrl;
        return;
      }
      if (noschCacheParam.startsWith(noschUrl)) {
        cacheUrls.push(cacheUrl);
      }
    }
  }

  if (cacheUrls.length) {
    window.location.href = cacheUrls[0];
  }
}

function init(request) {
  if (request.id === 'initScript') {
    viewCache(request.url);
  }
}

chrome.runtime.onMessage.addListener(init);

chrome.runtime.sendMessage({id: 'initScript', storageKey, scriptKey});
