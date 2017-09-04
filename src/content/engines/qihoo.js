function viewCache() {
  const nodes = document.querySelectorAll('li.res-list p.res-linkinfo > a.m');

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

  if (cacheNodes.length !== 0) {
    const node = cacheNodes[0];
    node.setAttribute('target', '_top');
    node.click();
  }
}

viewCache();
