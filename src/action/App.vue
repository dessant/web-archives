<template>
<div id="app" v-show="dataLoaded">
  <div class="title">
    {{ getText('extensionName') }}
  </div>
  <ul class="mdc-list">
    <li class="mdc-list-item ripple-surface"
        v-if="searchAllEngines"
        @click="selectEngine('allEngines')">
      <img class="mdc-list-item__start-detail" :src="getIcon('allEngines')">
      {{ getText('engineName_allEngines_full') }}
    </li>
    <li role="separator" class="mdc-list-divider"
        v-if="searchAllEngines || engines.length > 10">
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
import {getEnabledEngines} from 'utils/app';
import {getText} from 'utils/common';

export default {
  data: function() {
    return {
      dataLoaded: false,

      engines: [],
      searchAllEngines: false
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

    selectEngine: function(engine) {
      browser.runtime.sendMessage({
        id: 'actionPopupSubmit',
        engine: engine
      });
      window.close();
    }
  },

  created: async function() {
    const options = await storage.get(
      ['engines', 'disabledEngines', 'searchAllEnginesAction'],
      'sync'
    );
    const enEngines = await getEnabledEngines(options);

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
  min-width: 300px;
}

.title {
  display: flex;
  align-items: center;
  padding-top: 16px;
  padding-left: 16px;
  padding-right: 48px;
  white-space: nowrap;
  font-size: 1.13rem !important;
  @include mdc-typography('title');
  @include mdc-theme-prop('color', 'text-primary-on-light');
}

.engines-wrap {
  max-height: 488px;
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
</style>
