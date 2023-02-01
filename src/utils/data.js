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
  'showEngineIcons',
  'openCurrentDocAction',
  'openCurrentDocContextMenu',
  'appTheme',
  'showContribPage',
  'pinActionToolbarOpenCurrentDoc',
  'pinActionToolbarOptions',
  'pinActionToolbarContribute'
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

const engineIconAlias = {
  googleText: 'google',
  archiveOrgAll: 'archiveOrg',
  archiveIsAll: 'archiveIs'
};

const engineIconVariants = {
  archiveOrg: ['dark'],
  archiveIs: ['dark'],
  yahoo: ['dark']
};

const rasterEngineIcons = ['gigablast'];

// prettier-ignore
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

const pageArchiveHosts = {
  archiveOrg: ['web.archive.org'],
  archiveIs: [
    'archive.is',
    'archive.today',
    'archive.ph',
    'archive.vn',
    'archive.fo',
    'archive.li',
    'archive.md',
    'archiveiya74codqgiixo33q62qlrqtkgmcitqx5u2oeqnmn5bpcbiyd.onion'
  ],
  google: ['webcache.googleusercontent.com'],
  bing: ['cc.bingj.com'],
  yandex: ['yandexwebcache.net'],
  // gigablast: ['www.gigablast.com'],
  yahooJp: ['cache.yahoofs.jp'],
  // megalodon: ['megalodon.jp'],
  // baidu: ['cache.baiducontent.com'],
  qihoo: ['c.360webcache.com'],
  mailru: ['hl.mailru.su']
};

const linkArchiveHosts = {
  archiveOrg: ['web.archive.org'],
  archiveIs: [
    'archive.is',
    'archive.today',
    'archive.ph',
    'archive.vn',
    'archive.fo',
    'archive.li',
    'archive.md',
    'archiveiya74codqgiixo33q62qlrqtkgmcitqx5u2oeqnmn5bpcbiyd.onion'
  ],
  google: ['webcache.googleusercontent.com']
};

const linkArchiveUrlRx = {
  archiveOrg: /^https?:\/\/web\.archive\.org\/web\/[0-9]+\/(.*)/i,
  archiveIs:
    /^https?:\/\/(?:archive\.(?:is|today|ph|vn|fo|li|md)|archiveiya74codqgiixo33q62qlrqtkgmcitqx5u2oeqnmn5bpcbiyd.onion)\/o\/.*?\/(.*)/i,
  google:
    /^https?:\/\/webcache\.googleusercontent\.com\/search.*[?&]q=cache:.*$/i
};

const chromeDesktopUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36';

const chromeMobileUA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36';

const supportUrl = 'https://github.com/dessant/web-archives/issues';

export {
  optionKeys,
  engines,
  rasterEngineIcons,
  engineIconAlias,
  engineIconVariants,
  errorCodes,
  pageArchiveHosts,
  linkArchiveHosts,
  linkArchiveUrlRx,
  chromeDesktopUA,
  chromeMobileUA,
  supportUrl
};
