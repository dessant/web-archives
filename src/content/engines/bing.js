var storageKey;
var scriptKey;

function viewCache(url) {
  const node = document.querySelector(
    'ol#b_results li.b_algo:first-of-type div.b_attribution'
  );

  if (node) {
    const uAttr = node.getAttribute('u');
    if (uAttr) {
      const params = uAttr.split('|');
      const tabUrl = `http://cc.bingj.com/cache.aspx?q=url:${encodeURIComponent(
        url
      )}&d=${params[2]}&mkt=en-WW&setlang=en-US&w=${params[3]}`;
      window.location.href = tabUrl;
    }
  }
}

function init(request) {
  if (request.id === 'initScript') {
    viewCache(request.url);
  }
}

chrome.runtime.onMessage.addListener(init);

chrome.runtime.sendMessage({id: 'initScript', storageKey, scriptKey});
