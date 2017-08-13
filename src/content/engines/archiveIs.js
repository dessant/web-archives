function viewCache() {
  const node = document.querySelector(
    'div#CONTENT > div#row0 > div.THUMBS-BLOCK > div:last-of-type > a'
  );

  if (node) {
    window.location.href = node.href;
  }
}

viewCache();
