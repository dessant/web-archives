function viewCache() {
  const node = document.querySelector(
    'div#content_left > div.result[id="1"] div.f13 > a.m'
  );

  if (node) {
    window.location.href = node.href;
  }
}

viewCache();
