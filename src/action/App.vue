<template>
<div id="app" v-show="dataLoaded">
  <div class="header">
    <div class="title">
      {{ getText('extensionName') }}
    </div>
    <div class="header-buttons">
      <img class="contribute-icon"
          src="/src/contribute/assets/heart.svg"
          @click="showContribute">
      <img class="settings-icon" src="/src/icons/misc/settings.svg"
          @click="showSettings = !showSettings"/>
    </div>
  </div>

  <transition name="settings"
      @before-enter="beforeSettingsEnter"
      @after-enter="afterSettingsEnter"
      @after-leave="afterSettingsLeave">
    <div class="settings" v-show="showSettings">
      <v-textfield v-model="customUrl"
          :placeholder="getText('inputPlaceholder_customURL')"
          :fullwidth="true">
      </v-textfield>
    </div>
  </transition>

  <div class="list-padding-top"></div>
  <ul class="mdc-list list list-bulk-button" v-if="searchAllEngines">
    <li class="mdc-list-item list-item ripple-surface"
        @click="selectEngine('allEngines')">
      <img class="mdc-list-item__start-detail list-item-icon"
          :src="getIcon('allEngines')">
      {{ getText('engineName_allEngines_full') }}
    </li>
  </ul>
  <ul class="mdc-list list list-separator"
      v-if="searchAllEngines || hasScrollBar">
    <li role="separator" class="mdc-list-divider"></li>
  </ul>
  <div class="list-items-wrap" ref="items" :class="listClasses">
    <resize-observer @notify="handleSizeChange"></resize-observer>
    <ul class="mdc-list list list-items">
      <li class="mdc-list-item list-item ripple-surface"
          v-for="engine in engines"
          :key="engine.id"
          @click="selectEngine(engine)">
        <img class="mdc-list-item__start-detail list-item-icon"
            :src="getIcon(engine)">
        {{ getText(`engineName_${engine}_short`) }}
      </li>
    </ul>
  </div>

</div>
</template>

<script>
import browser from 'webextension-polyfill';
import {ResizeObserver} from 'vue-resize';
import {TextField} from 'ext-components';

import storage from 'storage/storage';
import {
  getEnabledEngines,
  showNotification,
  validateUrl,
  showContributePage
} from 'utils/app';
import {getText, isAndroid} from 'utils/common';
import {targetEnv} from 'utils/config';

export default {
  components: {
    [TextField.name]: TextField,
    [ResizeObserver.name]: ResizeObserver
  },

  data: function() {
    return {
      dataLoaded: false,

      showSettings: false,
      hasScrollBar: false,
      hideScrollBar: false,
      isAndroid: false,

      engines: [],
      searchAllEngines: false,
      customUrl: ''
    };
  },

  computed: {
    listClasses: function() {
      return {
        'list-items-scroll-bar-hidden': this.hideScrollBar,
        'list-items-max-height': !this.isAndroid
      };
    }
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

      this.closeAction();
    },

    showContribute: async function() {
      await showContributePage();
      this.closeAction();
    },

    closeAction: async function() {
      if (targetEnv === 'firefox' && (await isAndroid())) {
        browser.tabs.remove((await browser.tabs.getCurrent()).id);
      } else {
        window.close();
      }
    },

    handleSizeChange: function() {
      const items = this.$refs.items;
      this.hasScrollBar = items.scrollHeight > items.clientHeight;
    },

    beforeSettingsEnter: function() {
      this.hideScrollBar = !this.hasScrollBar;
    },

    afterSettingsEnter: function() {
      this.handleSizeChange();
      this.hideScrollBar = false;
    },

    afterSettingsLeave: function() {
      this.handleSizeChange();
    }
  },

  created: async function() {
    const options = await storage.get(
      ['engines', 'disabledEngines', 'searchAllEnginesAction'],
      'sync'
    );
    const enEngines = await getEnabledEngines(options);

    if (targetEnv === 'firefox' && (await isAndroid())) {
      this.isAndroid = true;
      if (enEngines.length <= 1 || options.searchAllEnginesAction === 'main') {
        // Removing the action popup has no effect on Android
        showNotification({messageId: 'error_optionsNotApplied'});
        return;
      }
    }

    this.searchAllEngines = options.searchAllEnginesAction === 'sub';
    this.engines = enEngines;

    this.dataLoaded = true;

    const mq = window.matchMedia('(min-width: 413px)');
    const mqChange = function(mq) {
      document.body.style.minWidth = mq.matches ? '413px' : 'initial';
    };
    mq.addListener(mqChange);
    mqChange(mq);
  }
};
</script>

<style lang="scss">
$mdc-theme-primary: #1abc9c;

@import '@material/list/mdc-list';
@import '@material/theme/mixins';
@import '@material/typography/mixins';
@import "@material/ripple/mixins";

@import 'vue-resize/dist/vue-resize';

html,
body,
#app {
  height: 100%;
}

#app {
  display: flex;
  flex-direction: column;
}

body {
  margin: 0;
  min-width: 413px;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  white-space: nowrap;
  padding-top: 16px;
  padding-left: 16px;
  padding-right: 16px;
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  @include mdc-typography('title');
  @include mdc-theme-prop('color', 'text-primary-on-light');
}

.header-buttons {
  display: flex;
  align-items: center;
  margin-left: 32px;
  @media (min-width: 413px) {
    margin-left: 56px;
  }
}

.contribute-icon {
  margin-right: 16px;
  cursor: pointer;
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

.list {
  padding: 0 !important;
}

.list-padding-top {
  margin-bottom: 8px;
}

.list-bulk-button {
  height: 48px;
}

.list-separator {
  height: 1px;
}

.list-items-wrap {
  overflow-y: auto;
  position: relative;
}

.list-items-max-height {
  max-height: 392px;
}

.list-items-scroll-bar-hidden {
  overflow-y: hidden;
}

.list-items {
  padding-bottom: 8px !important;
}

.list-item {
  padding-left: 16px;
  padding-right: 48px;
  cursor: pointer;
}

.list-item-icon {
  margin-right: 16px !important;
}

.ripple-surface {
  @include mdc-ripple-surface;
  @include mdc-ripple-radius;
  @include mdc-ripple-color;

  position: relative;
  outline: none;
  overflow: hidden;
}
</style>
