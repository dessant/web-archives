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
  'openCurrentDocContextMenu',
  'appTheme',
  'showContribPage',
  'pinActionToolbarOpenCurrentDoc',
  'pinActionToolbarOptions',
  'pinActionToolbarContribute',
  'removeUrlParams'
];

const searchUrl = browser.runtime.getURL('/src/search/index.html') + '?id={id}';

const engines = {
  archiveOrg: {
    target: 'https://web.archive.org/web/{url}'
  },
  archiveOrgAll: {
    target: 'https://web.archive.org/web/*/{url}'
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
  megalodon: {
    target: 'https://megalodon.jp/?url={url}',
    isExec: true
  },
  permacc: {
    target: searchUrl,
    isTaskId: true
  },
  ghostarchive: {
    target: 'https://ghostarchive.org/search?term={url}',
    isExec: true
  },
  webcite: {
    target: 'https://webcitation.org/query?url={url}&date={date}'
  },
  softwareHeritage: {
    target:
      'https://archive.softwareheritage.org/browse/origin/?origin_url={url}'
  }
};

const engineIconAlias = {
  archiveOrgAll: 'archiveOrg',
  archiveIsAll: 'archiveIs'
};

const engineIconVariants = {
  archiveOrg: ['dark'],
  archiveIs: ['dark'],
  webcite: ['dark']
};

const rasterEngineIcons = ['ghostarchive'];

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
  archiveOrg: [
    'web.archive.org',
    'web.archivep75mbjunhxc6x4j5mwjmomyxb573v42baldlqu56ruil2oiad.onion'
  ],
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
  yandex: ['yandexwebcache.net'],
  permacc: ['perma.cc', 'rejouer.perma.cc'],
  megalodon: ['megalodon.jp'],
  ghostarchive: ['ghostarchive.org'],
  webcite: ['www.webcitation.org']
};

const linkArchiveHosts = {
  archiveOrg: [
    'web.archive.org',
    'web.archivep75mbjunhxc6x4j5mwjmomyxb573v42baldlqu56ruil2oiad.onion'
  ],
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
  permacc: ['rejouer.perma.cc'],
  megalodon: ['megalodon.jp'],
  ghostarchive: ['ghostarchive.org']
};

const linkArchiveUrlRx = {
  archiveOrg:
    /^https?:\/\/web\.(?:archive\.org|archivep75mbjunhxc6x4j5mwjmomyxb573v42baldlqu56ruil2oiad\.onion)\/web\/[0-9]+\/(.*)/i,
  archiveIs:
    /^https?:\/\/(?:archive\.(?:is|today|ph|vn|fo|li|md)|archiveiya74codqgiixo33q62qlrqtkgmcitqx5u2oeqnmn5bpcbiyd\.onion)\/o\/.*?\/(.*)/i,
  permacc: /^https?:\/\/rejouer\.perma\.cc\/.*(?:\/|[0-9]+)mp_\/\/?\/?(.*)/i,
  megalodon: /https?:\/\/megalodon\.jp\/(?:\d+-)+\d+\/(.*)/i,
  ghostarchive: /^https?:\/\/ghostarchive\.org\/.*(?:\/|[0-9]+)mp_\/\/?\/?(.*)/i
};

const chromeDesktopUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const chromeMobileUA =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

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
