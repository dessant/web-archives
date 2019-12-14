<!-- prettier-ignore -->
<template>
<div id="app" v-show="dataLoaded">
  <div class="header">
    <div class="title">
      {{ getText('extensionName') }}
    </div>
    <div class="header-buttons">
      <v-icon-button class="contribute-button"
          :ripple="false"
          src="/src/contribute/assets/heart.svg"
          @click="showContribute">
      </v-icon-button>

      <v-icon-button class="settings-button"
          :ripple="false"
          @click="showSettings = !showSettings">
        <img class="mdc-icon-button__icon"
            :src="`/src/icons/misc/${showSettings ? 'linkOn': 'link'}.svg`"/>
      </v-icon-button>
    </div>
  </div>

  <transition name="settings" v-if="dataLoaded"
      @after-enter="settingsAfterEnter"
      @after-leave="settingsAfterLeave">
    <div class="settings" v-show="showSettings">
      <v-textfield ref="pageUrlInput" v-model.trim="pageUrl"
          :placeholder="getText('inputPlaceholder_pageURL')"
          :fullwidth="true">
      </v-textfield>
    </div>
  </transition>

  <div class="list-padding-top"></div>
  <ul class="mdc-list list list-bulk-button" v-if="searchAllEngines">
    <li class="mdc-list-item list-item"
        @click="selectItem('allEngines')">
      <img class="mdc-list-item__graphic list-item-icon"
          :src="getEngineIcon('allEngines')">
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
      <li class="mdc-list-item list-item"
          v-for="engine in engines"
          :key="engine.id"
          @click="selectItem(engine)">
        <img class="mdc-list-item__graphic list-item-icon"
            :src="getEngineIcon(engine)">
        {{ getText(`engineName_${engine}_short`) }}
      </li>
    </ul>
  </div>

</div>
</template>

<script>
import browser from 'webextension-polyfill';
import {ResizeObserver} from 'vue-resize';
import {MDCList} from '@material/list';
import {MDCRipple} from '@material/ripple';
import {IconButton, TextField} from 'ext-components';

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
    [IconButton.name]: IconButton,
    [TextField.name]: TextField,
    [ResizeObserver.name]: ResizeObserver
  },

  data: function() {
    return {
      dataLoaded: false,

      showSettings: false,
      hasScrollBar: false,
      isPopup: false,

      engines: [],
      searchAllEngines: false,
      pageUrl: ''
    };
  },

  computed: {
    listClasses: function() {
      return {
        'list-items-max-height': this.isPopup
      };
    }
  },

  methods: {
    getText,

    getEngineIcon: function(engine) {
      if (engine === 'googleText') {
        engine = 'google';
      } else if (engine === 'archiveOrgAll') {
        engine = 'archiveOrg';
      } else if (engine === 'archiveIsAll') {
        engine = 'archiveIs';
      }

      let ext = 'svg';
      if (['gigablast', 'megalodon'].includes(engine)) {
        ext = 'png';
      }

      return `/src/icons/engines/${engine}.${ext}`;
    },

    selectItem: async function(engine) {
      if (this.showSettings) {
        if (!validateUrl(this.pageUrl)) {
          this.focusPageUrlInput();
          showNotification({messageId: 'error_invalidUrl'});
          return;
        }
      }
      browser.runtime.sendMessage({
        id: 'actionPopupSubmit',
        pageUrl: this.pageUrl,
        engine
      });

      this.closeAction();
    },

    showContribute: async function() {
      await showContributePage();
      this.closeAction();
    },

    closeAction: async function() {
      if (!this.isPopup) {
        browser.tabs.remove((await browser.tabs.getCurrent()).id);
      } else {
        window.close();
      }
    },

    focusPageUrlInput: function() {
      this.$refs.pageUrlInput.$refs.input.focus();
    },

    handleSizeChange: function() {
      const items = this.$refs.items;
      this.hasScrollBar = items.scrollHeight > items.clientHeight;
    },

    settingsAfterEnter: function() {
      this.handleSizeChange();
      this.focusPageUrlInput();
    },

    settingsAfterLeave: function() {
      this.handleSizeChange();
      this.pageUrl = '';
    }
  },

  created: async function() {
    this.isPopup = !(await browser.tabs.getCurrent());
    if (!this.isPopup) {
      document.documentElement.style.height = '100%';
      document.body.style.minWidth = 'initial';
    }

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
      // Removing the action popup has no effect on Firefox for Android
      showNotification({messageId: 'error_optionsNotApplied'});
      return;
    }

    this.searchAllEngines = options.searchAllEnginesAction === 'sub';
    this.engines = enEngines;

    this.dataLoaded = true;
  },

  mounted: function() {
    window.setTimeout(() => {
      for (const listEl of document.querySelectorAll(
        '.list-bulk-button, .list-items'
      )) {
        const list = new MDCList(listEl);
        for (const el of list.listElements) {
          MDCRipple.attachTo(el);
        }
      }
    }, 500);
  }
};
</script>

<style lang="scss">
$mdc-theme-primary: #1abc9c;

@import '@material/icon-button/mdc-icon-button';
@import '@material/list/mdc-list';
@import '@material/icon-button/mixins';
@import '@material/theme/mixins';
@import '@material/typography/mixins';

@import 'vue-resize/dist/vue-resize';

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
  min-width: 340px;
  overflow: hidden;
  @include mdc-typography-base;
  font-size: 100%;
  background-color: #ffffff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  white-space: nowrap;
  padding-top: 16px;
  padding-left: 16px;
  padding-right: 12px;
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  @include mdc-typography(headline6);
  @include mdc-theme-prop(color, text-primary-on-light);
}

.header-buttons {
  display: flex;
  align-items: center;
  height: 24px;
  margin-left: 56px;
  @media (max-width: 339px) {
    margin-left: 32px;
  }
}

.contribute-button,
.settings-button {
  @include mdc-icon-button-size(24px, 24px, 8px);
}

.contribute-button {
  margin-right: 4px;
}

.settings {
  padding: 16px;
}

.settings-enter-active,
.settings-leave-active {
  max-height: 100px;
  padding-top: 16px;
  padding-bottom: 16px;
  transition: max-height 0.3s ease, padding-top 0.3s ease,
    padding-bottom 0.3s ease, opacity 0.2s ease;
}

.settings-enter,
.settings-leave-to {
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
  position: relative;
  height: 48px;
}

.list-separator {
  position: relative;
  height: 1px;
}

.list-items-wrap {
  overflow-y: auto;
}

.list-items-max-height {
  max-height: 392px;
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
</style>
