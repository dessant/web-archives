const optionKeys = [
  'engines',
  'disabledEngines',
  'showInContextMenu',
  'searchAllEnginesContextMenu',
  'searchAllEnginesAction',
  'showPageAction',
  'tabInBackgound',
  'searchModeAction',
  'searchModeContextMenu',
  'showEngineIcons'
];

const engines = {
  archiveOrg: {
    target: 'https://web.archive.org/web/{url}'
  },
  archiveOrgAll: {
    target: 'https://web.archive.org/web/*/{url}'
  },
  google: {
    target: 'https://webcache.googleusercontent.com/search?q=cache:{url}'
  },
  googleText: {
    target:
      'https://webcache.googleusercontent.com/search?strip=1&q=cache:{url}'
  },
  bing: {
    target: 'https://www.bing.com/search?q=url:{url}&go=Search&qs=bs&form=QBRE',
    isExec: true
  },
  yandex: {
    target: 'https://www.yandex.com/',
    isExec: true
  },
  archiveIs: {
    target: 'https://archive.is/newest/{url}'
  },
  archiveIsAll: {
    target: 'https://archive.is/{url}'
  },
  memento: {
    target: 'http://timetravel.mementoweb.org/memento/{date}/{url}'
  },
  gigablast: {
    target: 'https://www.gigablast.com/search?q=url:{url}',
    isExec: true
  },
  qihoo: {
    target: 'https://www.so.com/s?ie=utf-8&fr=none&src=home_www&q={url}',
    isExec: true
  },
  baidu: {
    target: 'https://www.baidu.com/s?wd={url}&ie=utf-8',
    isExec: true
  },
  yahooJp: {
    target: 'https://search.yahoo.co.jp/search?ei=UTF-8&p={url}',
    isExec: true
  },
  megalodon: {
    target: 'https://megalodon.jp/?url={url}',
    isExec: true
  },
  mailru: {
    target: 'https://go.mail.ru/search?q={url}&src=go&frm=main&fr=main',
    isExec: true
  },
  yahoo: {
    target: 'https://search.yahoo.com/search?p=url:{url}',
    isExec: true
  }
};

const errorCodes = [
  400,
  403,
  404,
  408,
  410,
  429,
  451,
  500,
  502,
  503,
  504,
  // Nonstandard
  444,
  450,
  509,
  530,
  598,
  // Cloudflare
  520,
  521,
  522,
  523,
  524,
  525,
  526,
  527
];

const chromeDesktopUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36';

const chromeMobileUA =
  'Mozilla/5.0 (Linux; Android 11; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36';

const projectUrl = 'https://github.com/dessant/web-archives';

export {
  optionKeys,
  engines,
  errorCodes,
  chromeDesktopUA,
  chromeMobileUA,
  projectUrl
};
