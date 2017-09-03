function viewCache() {
  const nodes = document.querySelectorAll('a[id^="sogou_snapshot_"]');

  const cacheUrls = [];
  for (let node of nodes) {
    const cacheUrl = node.href;
    const cacheParam = new URL(cacheUrl).searchParams.get('url');
    if (cacheParam) {
      if (cacheParam === url) {
        window.location.href = cacheUrl;
        return;
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
