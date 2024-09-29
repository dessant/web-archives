# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [7.0.0](https://github.com/dessant/web-archives/compare/v6.1.1...v7.0.0) (2024-09-29)


### ⚠ BREAKING CHANGES

* browser versions older than Safari 17
are no longer supported

### Features

* upgrade to Manifest V3 in Safari ([3fecc20](https://github.com/dessant/web-archives/commit/3fecc201feddf4dd46c9773e2a4fd8002f5e90cf))


### Bug Fixes

* remove Google Cache and Yahoo Cache ([b48f6d6](https://github.com/dessant/web-archives/commit/b48f6d62a799648baad89f1a1d0f2027cbf0ad9e)), closes [#90](https://github.com/dessant/web-archives/issues/90)
* restore compatibility with Safari 18 ([7869d64](https://github.com/dessant/web-archives/commit/7869d64e4b02b6bd6311cff114a30ea9ea52b3d8))

## [6.1.1](https://github.com/dessant/web-archives/compare/v6.1.0...v6.1.1) (2024-06-21)


### Bug Fixes

* update search engines ([5cf99f0](https://github.com/dessant/web-archives/commit/5cf99f024a74bc86009dc713b162ee393a24feb8))

## [6.1.0](https://github.com/dessant/web-archives/compare/v6.0.0...v6.1.0) (2024-06-20)


### Features

* add storage context ([6c662c7](https://github.com/dessant/web-archives/commit/6c662c7494652bb0b0e9fb7aac6c52272d15b94d))
* find closest match on Yandex ([7496504](https://github.com/dessant/web-archives/commit/74965042b911015fdf54f1fe9f45f356cbe51bda))
* open current page from Megalodon archive ([a19386f](https://github.com/dessant/web-archives/commit/a19386f299f86745dccdefd12f5f82ec62bd4e63))
* upgrade to Manifest V3 in Edge and Opera ([292d584](https://github.com/dessant/web-archives/commit/292d584c97aa7f8fd94fb9167d09d1a307dc146d))


### Bug Fixes

* apply context menu visibility option ([6732cd2](https://github.com/dessant/web-archives/commit/6732cd2f9fd286a5b46dbce9631ea5c4f3db669f))
* check search engine access in MV3 ([44c2eee](https://github.com/dessant/web-archives/commit/44c2eeedb7f1adeabb3d28710d5c83b7eb944c11))
* recover from error during context menu setup ([d4755b7](https://github.com/dessant/web-archives/commit/d4755b7d0cc960503164f281432e63b91823c621))
* run content scripts only once ([47a3375](https://github.com/dessant/web-archives/commit/47a3375bf4535d4405de9fa90cf8d6b295b9643a))
* use IndexedDB on all platforms ([9f799ec](https://github.com/dessant/web-archives/commit/9f799ece9eb82bc47b77947030c7928244fb2c68))

## [6.0.0](https://github.com/dessant/web-archives/compare/v5.0.0...v6.0.0) (2024-05-28)


### ⚠ BREAKING CHANGES

* browser versions older than Chrome 123, Edge 123,
Opera 109 and Safari 16.4 are no longer supported

### Features

* upgrade to Manifest V3 in Chrome ([45a3638](https://github.com/dessant/web-archives/commit/45a3638553fd86b02eb580823fab53b4d3c77aa5))

## [5.0.0](https://github.com/dessant/web-archives/compare/v4.1.0...v5.0.0) (2023-11-06)


### ⚠ BREAKING CHANGES

* browser versions older than Firefox 115
are no longer supported

### Features

* search on WebCite ([d4e653d](https://github.com/dessant/web-archives/commit/d4e653d60ca134db1c98fc833e41fd9dc7700712))
* use non-persistent background page in Firefox ([b629343](https://github.com/dessant/web-archives/commit/b6293436ee811a710c792490a7f30505f629bc05))


### Bug Fixes

* improve new tab setup ([76f60b6](https://github.com/dessant/web-archives/commit/76f60b66a1a593aa7badc94607ab6b8df7c91488))
* improve platform detection ([d65ec42](https://github.com/dessant/web-archives/commit/d65ec42675ac32f6861eace691aa3156d4fc19a1))
* set initial browser action popup height in Safari ([f738727](https://github.com/dessant/web-archives/commit/f73872759da7b4484fab95aa333c868c49633fe5))

## [4.1.0](https://github.com/dessant/web-archives/compare/v4.0.0...v4.1.0) (2023-07-16)


### Features

* search on Ghostarchive ([22c674a](https://github.com/dessant/web-archives/commit/22c674a94d2f05c16b82a85b2a68e6c6672df6d7)), closes [#41](https://github.com/dessant/web-archives/issues/41)
* search on Perma.cc ([09b5e43](https://github.com/dessant/web-archives/commit/09b5e43900890ce6227d82ca18ee03ed7ce48493)), closes [#8](https://github.com/dessant/web-archives/issues/8)


### Bug Fixes

* apply context menu visibility option ([6956486](https://github.com/dessant/web-archives/commit/69564862380fd0aedc7132b86d5b5855c626d8b0))
* prevent duplicate context menu items ([df7c7ce](https://github.com/dessant/web-archives/commit/df7c7cee1d7ef10eeb859f463827044c564c587f))
* remove Gigablast ([8f6b228](https://github.com/dessant/web-archives/commit/8f6b22869da1b1246fbac5afdd57829b75958e31))
* update action toolbar ([f65a652](https://github.com/dessant/web-archives/commit/f65a652a69349fdb7f13aa84acb9bbf05851337e))
* update dependencies ([de52216](https://github.com/dessant/web-archives/commit/de5221672a02cc410f20d31c9150b4a12968a521))
* update Yandex search ([ecc38da](https://github.com/dessant/web-archives/commit/ecc38daec05efb6bacfadb46bb0fc11a9fb88132))

## [4.0.0](https://github.com/dessant/web-archives/compare/v3.1.0...v4.0.0) (2023-02-02)


### ⚠ BREAKING CHANGES

* browser versions older than Chrome 92, Edge 92,
and Opera 78 are no longer supported

### Features

* Dark theme is now supported
* migrate to Vuetify ([096567a](https://github.com/dessant/web-archives/commit/096567a973e74df9ef84268cde8afc47ede82dd2))


### Bug Fixes

* remove deprecated search engines ([21d853f](https://github.com/dessant/web-archives/commit/21d853f6de38029b1c5dfe6644f7a96b79722761)), closes [#63](https://github.com/dessant/web-archives/issues/63)
* update dependencies ([ba987bc](https://github.com/dessant/web-archives/commit/ba987bc2c7c3808dd9aceea34d019102aca237d9))
* update Yandex ([88734f6](https://github.com/dessant/web-archives/commit/88734f654116fcd144c82a652059d2ca0fb1c9b2))

## [3.1.0](https://github.com/dessant/web-archives/compare/v3.0.2...v3.1.0) (2022-01-15)


### Features

* open current page ([1696f1c](https://github.com/dessant/web-archives/commit/1696f1c13df8d1013c953e4f41830f6d773daab5)), closes [#34](https://github.com/dessant/web-archives/issues/34)

### [3.0.2](https://github.com/dessant/web-archives/compare/v3.0.1...v3.0.2) (2022-01-06)


### Bug Fixes

* update Yahoo ([eae85ef](https://github.com/dessant/web-archives/commit/eae85ef558edbcd5bdc38358b13fb18ce19efac6))
* update Yandex ([0cf2cc4](https://github.com/dessant/web-archives/commit/0cf2cc42f96078123ea6648169f76f3662f4d161))

### [3.0.1](https://github.com/dessant/web-archives/compare/v3.0.0...v3.0.1) (2022-01-04)


### Bug Fixes

* configure browser action event listener ([4a05858](https://github.com/dessant/web-archives/commit/4a058587d8ae1ed0293f9c3d79497df776403f4d))

## [3.0.0](https://github.com/dessant/web-archives/compare/v2.1.1...v3.0.0) (2022-01-04)


### ⚠ BREAKING CHANGES

* browser versions older than Chrome 83, Edge 83, Firefox 91
and Opera 69 are no longer supported

### Features

* add option for hiding search engine icons ([c65f946](https://github.com/dessant/web-archives/commit/c65f9462786e0c3b4e1ca8ffaebbc1b3d8d7cd55))
* add support for Safari and Samsung Internet ([d7cd2ef](https://github.com/dessant/web-archives/commit/d7cd2ef9e7c6717df4ffc708ae15f2b2fe207737))
* search on Mail.ru and Yahoo ([c67a561](https://github.com/dessant/web-archives/commit/c67a5613052a7dfb1b5efca9f3367103a6f36e65))

### [2.1.1](https://github.com/dessant/web-archives/compare/v2.1.0...v2.1.1) (2020-09-22)


### Bug Fixes

* comply with the description length limit on the Microsoft Store ([2d775d2](https://github.com/dessant/web-archives/commit/2d775d20af0a003d0ddfe6d94db7a239a6fe8866))

## [2.1.0](https://github.com/dessant/web-archives/compare/v2.0.1...v2.1.0) (2020-09-22)


### Features

* add support for Firefox Daylight ([7440eec](https://github.com/dessant/web-archives/commit/7440eecbe56e07ef9ce8e7a1fff8ae5720aafe8f))
* support Chrome Incognito ([a1cecce](https://github.com/dessant/web-archives/commit/a1cecce202caf846c1d7514b5739d2adf1af012a))


### Bug Fixes

* disable page action on Android ([296b75a](https://github.com/dessant/web-archives/commit/296b75a30bbc7ddea745448c4d1478ffb3b52298))
* increase favicon size ([8851280](https://github.com/dessant/web-archives/commit/8851280168340aa789a8bfd72ef243adc8939c86))
* load desktop site of Yandex, Sogou, Baidu, Naver and Yahoo Japan on mobile ([a74a72a](https://github.com/dessant/web-archives/commit/a74a72a45efe23e2074afa13e9ae08e94dbc4578))
* remove legacy browser check ([ebb4f81](https://github.com/dessant/web-archives/commit/ebb4f81ce008782283a7d0417b2e1f7f7ee0c7bd))
* set desktop user agent for Qihoo on Android ([a4b5d92](https://github.com/dessant/web-archives/commit/a4b5d92d0e4373528573bef0454af87daacdbb5d))
* update engines and rework script injection ([fc580a6](https://github.com/dessant/web-archives/commit/fc580a69b828d00f8a41db7743665bd7c26b9e7a))
* update Yandex ([952feff](https://github.com/dessant/web-archives/commit/952feff6a249873268fd25800fea77723a943086))

### [2.0.1](https://github.com/dessant/web-archives/compare/v2.0.0...v2.0.1) (2019-12-19)


### Bug Fixes

* better align select component ([54c924f](https://github.com/dessant/web-archives/commit/54c924fed18a418ad051ef9833e90d5f183a1577))
* flip button positions ([a19c16c](https://github.com/dessant/web-archives/commit/a19c16cde95d8c401ffebd2078d2892f04dc48dc))

## [2.0.0](https://github.com/dessant/web-archives/compare/v1.8.0...v2.0.0) (2019-12-15)


### ⚠ BREAKING CHANGES

* browser versions before Chrome 76, Firefox 68 and Opera 63
are no longer supported

### Features

* add overflow menu with links for options and website ([e44c6e7](https://github.com/dessant/web-archives/commit/e44c6e748dfed32fc401491eba9296b908c97f4f))
* rename project to Web Archives ([8ed68d0](https://github.com/dessant/web-archives/commit/8ed68d04228a2e385d09a5be5637f8a95c392e18))


### Bug Fixes

* reference appropriate storage ([e78fb74](https://github.com/dessant/web-archives/commit/e78fb74226dcdf70b01a8f1290900f79a080a54c))
* set parent tab for search results opened in new tabs ([94f9fb0](https://github.com/dessant/web-archives/commit/94f9fb0d3f3bf96f262641b16c7da6fb2eb6f6d5)), closes [#14](https://github.com/dessant/web-archives/issues/14)

## [1.8.0](https://github.com/dessant/web-archives/compare/v1.7.2...v1.8.0) (2019-09-07)


### Bug Fixes

* do not encode URL for Archive.is ([e222485](https://github.com/dessant/web-archives/commit/e222485)), closes [#12](https://github.com/dessant/web-archives/issues/12)
* do not encode URL for Wayback Machine ([ab2f19b](https://github.com/dessant/web-archives/commit/ab2f19b))


### Features

* new engines for listing all versions on Wayback Machine and Archive.is ([9f389db](https://github.com/dessant/web-archives/commit/9f389db)), closes [#11](https://github.com/dessant/web-archives/issues/11)

### [1.7.2](https://github.com/dessant/web-archives/compare/v1.7.1...v1.7.2) (2019-08-25)

### [1.7.1](https://github.com/dessant/web-archives/compare/v1.7.0...v1.7.1) (2019-06-25)



## [1.7.0](https://github.com/dessant/web-archives/compare/v1.6.1...v1.7.0) (2019-05-24)


### Features

* build with travis ([92f9d54](https://github.com/dessant/web-archives/commit/92f9d54))



### [1.6.1](https://github.com/dessant/web-archives/compare/v1.6.0...v1.6.1) (2019-05-15)


### Bug Fixes

* remove URL hash only for Wayback Machine ([7567aaf](https://github.com/dessant/web-archives/commit/7567aaf)), closes [#7](https://github.com/dessant/web-archives/issues/7)



## [1.6.0](https://github.com/dessant/web-archives/compare/v1.5.3...v1.6.0) (2019-05-11)


### Bug Fixes

* remove URL hash before search ([1ebf421](https://github.com/dessant/web-archives/commit/1ebf421)), closes [#7](https://github.com/dessant/web-archives/issues/7)


### Features

* change license to GPLv3 ([f950b0a](https://github.com/dessant/web-archives/commit/f950b0a))
* update dependencies and refresh user interface ([bb3407d](https://github.com/dessant/web-archives/commit/bb3407d))



<a name="1.5.3"></a>
## [1.5.3](https://github.com/dessant/web-archives/compare/v1.5.2...v1.5.3) (2018-07-12)



<a name="1.5.2"></a>
## [1.5.2](https://github.com/dessant/web-archives/compare/v1.5.1...v1.5.2) (2018-06-29)


### Bug Fixes

* use https to load search results ([aec0966](https://github.com/dessant/web-archives/commit/aec0966)), closes [#1](https://github.com/dessant/web-archives/issues/1)



<a name="1.5.1"></a>
## [1.5.1](https://github.com/dessant/web-archives/compare/v1.5.0...v1.5.1) (2018-05-01)


### Bug Fixes

* set default background color ([4195ff0](https://github.com/dessant/web-archives/commit/4195ff0)), closes [#2](https://github.com/dessant/web-archives/issues/2)



<a name="1.5.0"></a>
# [1.5.0](https://github.com/dessant/web-archives/compare/v1.4.3...v1.5.0) (2018-04-30)


### Bug Fixes

* add labels for select components and change options layout ([a82c480](https://github.com/dessant/web-archives/commit/a82c480))
* update Archive.is logo ([3982a1f](https://github.com/dessant/web-archives/commit/3982a1f))


### Features

* show search engine icons in context menu ([d5b3f16](https://github.com/dessant/web-archives/commit/d5b3f16))



<a name="1.4.3"></a>
## [1.4.3](https://github.com/dessant/web-archives/compare/v1.4.2...v1.4.3) (2018-03-07)


### Bug Fixes

* link to latest Archive.is copy directly ([15b62e5](https://github.com/dessant/web-archives/commit/15b62e5))
* update dependencies ([178a076](https://github.com/dessant/web-archives/commit/178a076))
* update gigablast cache link selector ([68bc5d6](https://github.com/dessant/web-archives/commit/68bc5d6))



<a name="1.4.2"></a>
## [1.4.2](https://github.com/dessant/web-archives/compare/v1.4.1...v1.4.2) (2018-01-03)


### Bug Fixes

* adjust spacing between popup header items ([d7057bc](https://github.com/dessant/web-archives/commit/d7057bc))
* reduce size of imported background code ([3b80722](https://github.com/dessant/web-archives/commit/3b80722))
* update mdc ripple class ([7a66046](https://github.com/dessant/web-archives/commit/7a66046))



<a name="1.4.1"></a>
## [1.4.1](https://github.com/dessant/web-archives/compare/v1.4.0...v1.4.1) (2018-01-01)


### Bug Fixes

* action popup sizing ([54838f2](https://github.com/dessant/web-archives/commit/54838f2))
* workaround for popup rendering issue on Firefox ([2f1e239](https://github.com/dessant/web-archives/commit/2f1e239))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/dessant/web-archives/compare/v1.3.0...v1.4.0) (2017-12-30)


### Bug Fixes

* add contribPageLastOpen ([56955c5](https://github.com/dessant/web-archives/commit/56955c5))
* decrease space between popup header items on small displays ([1f85125](https://github.com/dessant/web-archives/commit/1f85125))
* do not set min-width for small screens ([ae84bda](https://github.com/dessant/web-archives/commit/ae84bda))
* do not show page action on server error by default ([34215bf](https://github.com/dessant/web-archives/commit/34215bf))
* handle list overflowing on small screens ([fcf18cc](https://github.com/dessant/web-archives/commit/fcf18cc))
* minimize draggable surface for search engine options ([0efe71b](https://github.com/dessant/web-archives/commit/0efe71b))
* vertically center popup buttons ([bb6f88e](https://github.com/dessant/web-archives/commit/bb6f88e))


### Features

* add contribution page ([1496a3f](https://github.com/dessant/web-archives/commit/1496a3f))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/dessant/web-archives/compare/v1.2.0...v1.3.0) (2017-12-14)


### Bug Fixes

* set favicon for options and action pages ([2d836f4](https://github.com/dessant/web-archives/commit/2d836f4))
* use svg icon for settings button ([f1b7593](https://github.com/dessant/web-archives/commit/f1b7593))
* validation for FTP URLs ([e6e6af4](https://github.com/dessant/web-archives/commit/e6e6af4))


### Features

* support Firefox for Android ([d7a30db](https://github.com/dessant/web-archives/commit/d7a30db))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/dessant/web-archives/compare/v1.1.2...v1.2.0) (2017-09-28)


### Bug Fixes

* call yarn install instead of upgrade after package.json change ([712baac](https://github.com/dessant/web-archives/commit/712baac))
* ensure correct input font size ([06a8c6c](https://github.com/dessant/web-archives/commit/06a8c6c))
* import theme and typography mixins instead of CSS ([c45f3db](https://github.com/dessant/web-archives/commit/c45f3db))
* inline CSS not needed anymore, upstream fix ([d03a58c](https://github.com/dessant/web-archives/commit/d03a58c))
* move page title template into locale message ([4062db9](https://github.com/dessant/web-archives/commit/4062db9))


### Features

* search for a custom URL ([d2de944](https://github.com/dessant/web-archives/commit/d2de944))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/dessant/web-archives/compare/v1.1.1...v1.1.2) (2017-09-12)


### Bug Fixes

* apply custom locale messages to chrome target ([f381d50](https://github.com/dessant/web-archives/commit/f381d50))



<a name="1.1.1"></a>
## [1.1.1](https://github.com/dessant/web-archives/compare/v1.1.0...v1.1.1) (2017-09-12)


### Bug Fixes

* Chrome Web Store description must be 132 characters or less ([27b3de8](https://github.com/dessant/web-archives/commit/27b3de8))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/dessant/web-archives/compare/v1.0.0...v1.1.0) (2017-09-12)


### Bug Fixes

* Google Cache text-only name ([ac52aec](https://github.com/dessant/web-archives/commit/ac52aec))
* prevent navigation to a different URL when the exact match is not the first result ([3c66f9a](https://github.com/dessant/web-archives/commit/3c66f9a))
* switch to common names for widget locations ([dfa8865](https://github.com/dessant/web-archives/commit/dfa8865))
* use compressed style in option names ([358b336](https://github.com/dessant/web-archives/commit/358b336))
* use full name for browser toolbar ([3e9893b](https://github.com/dessant/web-archives/commit/3e9893b))


### Features

* ignore URL scheme while searching for a match ([6a9846b](https://github.com/dessant/web-archives/commit/6a9846b))
* set options page title ([2cffbe2](https://github.com/dessant/web-archives/commit/2cffbe2))
* support Chrome and Opera ([b1c3537](https://github.com/dessant/web-archives/commit/b1c3537))
* use scope hoisting in production ([f4fbc4c](https://github.com/dessant/web-archives/commit/f4fbc4c))



<a name="1.0.0"></a>
# 1.0.0 (2017-08-16)

* Add .babelrc for content scripts ([4053c36](https://github.com/dessant/web-archives/commit/4053c36))
* Add content ([59bd1a6](https://github.com/dessant/web-archives/commit/59bd1a6))
* Add workaround for Bugzilla@Mozilla#1290016 ([78fe0cc](https://github.com/dessant/web-archives/commit/78fe0cc))
* Prepare 1.0.0 release ([e5cd9db](https://github.com/dessant/web-archives/commit/e5cd9db))
* Prevent FOUC ([981e668](https://github.com/dessant/web-archives/commit/981e668))
* Remove unused font file ([da0144a](https://github.com/dessant/web-archives/commit/da0144a))
* Search for lastFocusedWindow instead of currentWindow ([37e4946](https://github.com/dessant/web-archives/commit/37e4946))
* Show cursor pointer when hovering above action popup buttons ([02c2d4b](https://github.com/dessant/web-archives/commit/02c2d4b))
* Simplify yahoo node selector ([aae34a0](https://github.com/dessant/web-archives/commit/aae34a0))
* Style fix ([b74de1f](https://github.com/dessant/web-archives/commit/b74de1f))
