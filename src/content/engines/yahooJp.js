function viewCache() {
  const nodes = document.evaluate(
    '//div[@id="WS2m"]/div[@class="w"]/div[@class="bd"]/div[@class="a"]//a[text()="キャッシュ"]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  const cacheUrls = [];
  const noschUrl = url.replace(/^(?:https?|ftp):\/\/(.*)$/i, '$1');
  const nodeCount = nodes.snapshotLength;
  for (let i = 0; i < nodeCount; i++) {
    let node = nodes.snapshotItem(i);
    const cacheUrl = node.href;
    const cacheParam = new URL(cacheUrl).searchParams.get('u');

    if (cacheParam) {
      const noschCacheParam = cacheParam.replace(
        /^(?:https?|ftp):\/\/(.*)$/i,
        '$1'
      );
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
