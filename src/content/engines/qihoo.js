function viewCache() {
  const nodes = document.querySelectorAll('li.res-list p.res-linkinfo > a.m');

  const cacheNodes = [];
  for (let node of nodes) {
    const cacheParam = new URL(node.href).searchParams.get('u');
    if (cacheParam) {
      if (cacheParam === url) {
        node.setAttribute('target', '_top');
        node.click();
        return;
      }
      if (cacheParam.startsWith(url)) {
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
