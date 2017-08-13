function viewCache() {
  const nodes = document.querySelectorAll(
    'div#main_pack li.sh_web_top a[href*="where=web_html&from=webkr"]'
  );

  const cacheUrls = [];
  for (let node of nodes) {
    const cacheUrl = node.href;
    const cacheParam = new URL(cacheUrl).searchParams.get('u');
    if (cacheParam) {
      if (cacheParam === url) {
        window.location.href = cacheUrl;
        break;
      }
      if (cacheParam.startsWith(url)) {
        cacheUrls.push(cacheUrl);
      }
    }
  }

  if (cacheUrls.length !== 0) {
    window.location.href = cacheUrls[0];
  }
}

viewCache();
