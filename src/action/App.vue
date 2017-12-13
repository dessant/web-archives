<template>
<div id="app" v-show="dataLoaded">
  <div class="header">
    <div class="title">
      {{ getText('extensionName') }}
    </div>
    <img class="settings-icon" src="/src/icons/misc/settings.svg"
        @click="showSettings = !showSettings"/>
  </div>

  <transition name="settings">
    <div class="settings" v-show="showSettings">
      <v-textfield v-model="customUrl"
          :placeholder="getText('inputPlaceholder_customURL')"
          :fullwidth="true">
      </v-textfield>
    </div>
  </transition>

  <ul class="mdc-list">
    <li class="mdc-list-item ripple-surface"
        v-if="searchAllEngines"
        @click="selectEngine('allEngines')">
      <img class="mdc-list-item__start-detail" :src="getIcon('allEngines')">
      {{ getText('engineName_allEngines_full') }}
    </li>
    <li role="separator" class="mdc-list-divider"
        v-if="searchAllEngines || engines.length > 8">
    </li>
    <div class="engines-wrap">
      <div class="engines">
        <li class="mdc-list-item ripple-surface"
            v-for="engine in engines"
            :key="engine.id"
            @click="selectEngine(engine)">
          <img class="mdc-list-item__start-detail" :src="getIcon(engine)">
          {{ getText(`engineName_${engine}_short`) }}
        </li>
      </div>
    </div>
  </ul>
</div>
</template>

<script>
import browser from 'webextension-polyfill';

import storage from 'storage/storage';
import {getEnabledEngines, showNotification, validateUrl} from 'utils/app';
import {getText, isAndroid} from 'utils/common';
import {targetEnv} from 'utils/config';
import Textfield from './components/Textfield';

export default {
  components: {
    [Textfield.name]: Textfield
  },

  data: function() {
    return {
      dataLoaded: false,

      showSettings: false,

      engines: [],
      searchAllEngines: false,
      customUrl: ''
    };
  },

  methods: {
    getText: getText,

    getIcon: function(name) {
      if (name === 'googleText') {
        name = 'google';
      }
      return `/src/icons/engines/${name}.png`;
    },

    selectEngine: async function(engine) {
      let customUrl = this.customUrl;
      if (customUrl) {
        customUrl = customUrl.trim();
        if (!validateUrl(customUrl)) {
          showNotification({messageId: 'error_invalidUrl'});
          return;
        }
      }
      browser.runtime.sendMessage({
        id: 'actionPopupSubmit',
        customUrl,
        engine
      });

      if (targetEnv === 'firefox' && (await isAndroid())) {
        browser.tabs.remove((await browser.tabs.getCurrent()).id);
      } else {
        window.close();
      }
    }
  },

  created: async function() {
    const options = await storage.get(
      ['engines', 'disabledEngines', 'searchAllEnginesAction'],
      'sync'
    );
    const enEngines = await getEnabledEngines(options);

    if (
      targetEnv === 'firefox' &&
      (await isAndroid()) &&
      (enEngines.length <= 1 || options.searchAllEnginesAction === 'main')
    ) {
      // Removing the action popup has no effect on Android
      showNotification({messageId: 'error_optionsNotApplied'});
      return;
    }

    this.searchAllEngines = options.searchAllEnginesAction === 'sub';
    this.engines = enEngines;

    this.dataLoaded = true;
  }
};
</script>

<style lang="scss">
$mdc-theme-primary: #1abc9c;

@import '@material/list/mdc-list';
@import '@material/theme/mixins';
@import '@material/typography/mixins';
@import "@material/ripple/mixins";

body {
  margin: 0;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  padding-left: 16px;
  padding-right: 16px;
}

.title {
  padding-right: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @include mdc-typography('title');
  @include mdc-theme-prop('color', 'text-primary-on-light');
}

.settings-icon {
  cursor: pointer;
}

.settings {
  padding: 16px;
}

.settings-enter-active, .settings-leave-active {
  max-height: 100px;
  padding-top: 16px;
  padding-bottom: 16px;
  transition: max-height .3s ease,
              padding-top .3s ease,
              padding-bottom .3s ease,
              opacity .2s ease;
}

.settings-enter, .settings-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
}

.engines-wrap {
  max-height: 392px;
  overflow-y: auto;
}

.engines {
  margin-bottom: 8px;
}

.mdc-list {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.mdc-list-item {
  padding-left: 16px;
  padding-right: 48px;
  white-space: nowrap;
  cursor: pointer;
}

.mdc-list-item__start-detail {
  margin-right: 16px !important;
}

.ripple-surface {
  @include mdc-ripple-base;
  @include mdc-ripple-bg((pseudo: "::before"));
  @include mdc-ripple-fg((pseudo: "::after"));

  overflow: hidden;
}

@media (min-width: 360px) {
  body {
    min-width: 360px;
  }

  .title {
    overflow: initial;
  }
}
</style>
