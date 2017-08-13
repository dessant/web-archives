function viewCache() {
  const node = document.evaluate(
    '//li[contains(concat(" ", normalize-space(@class), " "), " serp-item ")][1]' +
      '//div[contains(concat(" ", normalize-space(@class), " "), " extralinks__popup ")]' +
      '/a[text()="Cached page"]',
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (node) {
    window.location.href = node.href;
  }
}

viewCache();
