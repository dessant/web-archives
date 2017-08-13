function viewCache() {
  const node = document.evaluate(
    '//table[@class="result"][1]/tbody/tr/td/a[text()="cached"]',
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (node) {
    window.location.href = node.href;
  }
}

function init() {
  const loaderImg = document.querySelector(
    'div#bodycont > div:only-child > img[src="/gears.gif"]'
  );

  if (loaderImg) {
    const observer = new MutationObserver(function(mutations) {
      removeCallbacks();
      viewCache();
    });

    const removeCallbacks = function() {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
    const timeoutId = window.setTimeout(removeCallbacks, 120000); // 2 minutes

    observer.observe(document.getElementById('bodycont'), {childList: true});
  } else {
    viewCache();
  }
}

init();
