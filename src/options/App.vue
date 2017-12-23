<template>
<div id="app" v-if="dataLoaded">
  <div class="section">
    <div class="section-title" v-once>
      {{ getText('optionSectionTitle_engines') }}
    </div>
    <div class="section-desc" v-once>
      {{ getText('optionSectionDescription_engines') }}
    </div>
    <v-draggable class="option-wrap" :list="options.engines">
      <div class="option" v-for="engine in options.engines" :key="engine.id">
        <v-form-field :input-id="engine"
            :label="getText(`engineName_${engine}_full`)">
          <v-checkbox :id="engine" :checked="engineEnabled(engine)"
              @change="setEngineState(engine, $event)">
          </v-checkbox>
        </v-form-field>
      </div>
    </v-draggable>
  </div>

  <div class="section">
    <div class="section-title" v-once>
      {{ getText('optionSectionTitle_misc') }}
    </div>
    <div class="option-wrap">
      <div class="option" v-if="contextMenuEnabled">
        <v-select v-model="options.showInContextMenu"
            :options="selectOptions.showInContextMenu">
        </v-select>
      </div>
      <div class="option" v-if="contextMenuEnabled">
        <v-select v-model="options.searchAllEnginesContextMenu"
            :options="selectOptions.searchAllEnginesContextMenu">
        </v-select>
      </div>
      <div class="option">
        <v-select v-model="options.searchAllEnginesAction"
            :options="selectOptions.searchAllEnginesAction">
        </v-select>
      </div>
      <div class="option" v-show="targetEnv === 'firefox'">
        <v-form-field input-id="spa"
            :label="getText('optionTitle_showPageAction')">
          <v-switch id="spa" v-model="options.showPageAction"></v-switch>
        </v-form-field>
      </div>
      <div class="option">
        <v-form-field input-id="ont"
            :label="getText('optionTitle_openNewTab')">
          <v-switch id="ont" v-model="options.openNewTab"></v-switch>
        </v-form-field>
      </div>
      <div class="option">
        <v-form-field input-id="tib"
            :label="getText('optionTitle_tabInBackgound')">
          <v-switch id="tib" v-model="options.tabInBackgound"></v-switch>
        </v-form-field>
      </div>
    </div>
  </div>

</div>
</template>

<script>
import browser from 'webextension-polyfill';
import _ from 'lodash';
import draggable from 'vuedraggable';
import {Checkbox, FormField, Switch, Select} from 'ext-components';

import storage from 'storage/storage';
import {getOptionLabels} from 'utils/app';
import {getText, isAndroid} from 'utils/common';
import {optionKeys} from 'utils/data';
import {targetEnv} from 'utils/config';

export default {
  components: {
    'v-draggable': draggable,
    [Checkbox.name]: Checkbox,
    [Switch.name]: Switch,
    [Select.name]: Select,
    [FormField.name]: FormField
  },

  data: function() {
    return {
      dataLoaded: false,

      selectOptions: getOptionLabels({
        showInContextMenu: ['all', 'link', 'false'],
        searchAllEnginesContextMenu: ['main', 'sub', 'false'],
        searchAllEnginesAction: ['main', 'sub', 'false']
      }),
      targetEnv,
      contextMenuEnabled: true,

      options: {
        engines: [],
        disabledEngines: [],
        showInContextMenu: '',
        searchAllEnginesContextMenu: '',
        searchAllEnginesAction: '',
        showPageAction: false,
        openNewTab: false,
        tabInBackgound: false
      }
    };
  },

  methods: {
    getText: getText,

    engineEnabled: function(engine) {
      return !_.includes(this.options.disabledEngines, engine);
    },

    setEngineState: async function(engine, enabled) {
      if (enabled) {
        this.options.disabledEngines = _.without(
          this.options.disabledEngines,
          engine
        );
      } else {
        this.options.disabledEngines.push(engine);
      }
    }
  },

  created: async function() {
    const options = await storage.get(optionKeys, 'sync');

    for (const option of Object.keys(this.options)) {
      this.options[option] = options[option];
      this.$watch(`options.${option}`, async function(value) {
        await storage.set({[option]: value}, 'sync');
      });
    }

    if (targetEnv === 'firefox' && (await isAndroid())) {
      this.contextMenuEnabled = false;
    }

    document.title = getText('pageTitle', [
      getText('pageTitle_options'),
      getText('extensionName')
    ]);

    this.dataLoaded = true;
  }
};
</script>

<style lang="scss">
$mdc-theme-primary: #1abc9c;

@import '@material/theme/mixins';
@import '@material/typography/mixins';

.mdc-select__menu {
  top: inherit !important;
  left: inherit !important;
}

.mdc-checkbox {
  margin-left: 8px;
}

.mdc-switch {
  margin-right: 12px;
}

#app {
  display: grid;
  grid-row-gap: 32px;
  padding: 12px;
}

.section-title,
.section-desc {
  @include mdc-theme-prop('color', 'text-primary-on-light');
}

.section-title {
  @include mdc-typography('title');
}

.section-desc {
  @include mdc-typography('body1');
  padding-top: 8px;
}

.option-wrap {
  display: grid;
  grid-row-gap: 12px;
  padding-top: 16px;
  grid-auto-columns: min-content;
}

.option {
  display: flex;
  align-items: center;
  height: 36px;
}
</style>
