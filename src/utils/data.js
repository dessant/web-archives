const optionKeys = [
  'engines',
  'disabledEngines',
  'showInContextMenu',
  'searchAllEnginesContextMenu',
  'searchAllEnginesAction',
  'showPageAction',
  'openNewTab',
  'tabInBackgound'
];

const engines = {
  archiveOrg: {
    url: 'https://web.archive.org/web/{url}'
  },
  google: {
    url: 'https://webcache.googleusercontent.com/search?q=cache:{url}'
  },
  googleText: {
    url: 'https://webcache.googleusercontent.com/search?strip=1&q=cache:{url}'
  },
  bing: {
    url: 'https://www.bing.com/search?q=url:{url}&go=Search&qs=bs&form=QBRE'
  },
  yandex: {
    url: 'https://www.yandex.com/search/?text={url}&url={url}'
  },
  archiveIs: {
    url: 'https://archive.is/newest/{url}'
  },
  memento: {
    url: 'https://timetravel.mementoweb.org/reconstruct/{url}'
  },
  webcite: {
    url: 'https://www.webcitation.org/query?url={url}&date={date}'
  },
  exalead: {
    url: 'https://www.exalead.com/search/web/cached/?url={url}&q={url}'
  },
  gigablast: {
    url: 'https://www.gigablast.com/search?q=url:{url}'
  },
  sogou: {
    url: 'https://www.sogou.com/web?query={url}'
  },
  qihoo: {
    url: 'https://www.so.com/s?ie=utf-8&fr=none&src=home_www&q={url}'
  },
  baidu: {
    url: 'https://www.baidu.com/s?wd={url}&ie=utf-8'
  },
  naver: {
    url:
      'https://search.naver.com/search.naver?where=webkr&query=site:{url}&ie=utf8'
  },
  yahooJp: {
    url: 'https://search.yahoo.co.jp/search?ei=UTF-8&p={url}'
  },
  megalodon: {
    url: 'https://megalodon.jp/?url={url}'
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

module.exports = {
  optionKeys,
  engines,
  errorCodes
};
