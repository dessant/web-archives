function viewCache() {
  const nodes = document.evaluate(
    '//div[@class="bd"]//a[text()="キャッシュ"]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  const cacheUrls = [];
  const rxUrl = /^(?:https?|ftp):\/\/(.*)$/i;
  const noschUrl = url.replace(rxUrl, '$1');
  const nodeCount = nodes.snapshotLength;
  for (let i = 0; i < nodeCount; i++) {
    let node = nodes.snapshotItem(i);
    const cacheUrl = node.href;
    const cacheParam = new URL(cacheUrl).searchParams.get('u');

    if (cacheParam) {
      const noschCacheParam = cacheParam.replace(rxUrl, '$1');
      if (noschCacheParam === noschUrl) {
        window.location.href = cacheUrl;
        break;
      }
      if (noschCacheParam.startsWith(noschUrl)) {
        cacheUrls.push(cacheUrl);
      }
    }
  }

  if (cacheUrls.length !== 0) {
    window.location.href = cacheUrls[0];
  }
}

viewCache();
