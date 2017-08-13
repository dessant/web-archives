function viewCache() {
  const node = document.querySelector('div#bgcontain a[id^="fish"]');

  if (node) {
    window.location.href = node.href;
  }
}

viewCache();
