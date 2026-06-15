<template>
  <vn-app v-if="dataLoaded" :class="appClasses">
    <div class="section-engines">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_engines') }}
      </div>
      <div class="section-desc" v-once>
        {{ getText('optionSectionDescription_engines') }}
      </div>

      <v-draggable
        class="option-wrap"
        v-model="options.engines"
        item-key="id"
        :delay="120"
      >
        <template #item="{element}">
          <div class="option">
            <vn-checkbox
              :label="getText(`optionTitle_${element}`)"
              :model-value="engineEnabled(element)"
              @click="setEngineState(element, $event.target.checked)"
            >
            </vn-checkbox>
          </div>
        </template>
      </v-draggable>
    </div>

    <div class="section-context-menu" v-if="contextMenuEnabled">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_contextmenu') }}
      </div>
      <div class="option-wrap">
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_showInContextMenu')"
            :items="listItems.showInContextMenu"
            v-model="options.showInContextMenu"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option select" v-if="searchAllEnginesEnabled">
          <vn-select
            :label="getText('optionTitle_searchAllEngines')"
            :items="listItems.searchAllEnginesContextMenu"
            v-model="options.searchAllEnginesContextMenu"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option">
          <vn-switch
            :label="getText('optionTitle_openCurrentDocContextMenu')"
            v-model="options.openCurrentDocContextMenu"
          ></vn-switch>
        </div>
      </div>
    </div>

    <div class="section-toolbar">
      <div class="section-title" v-once>
        {{
          getText(
            $env.isMobile
              ? 'optionSectionTitleMobile_toolbar'
              : 'optionSectionTitle_toolbar'
          )
        }}
      </div>
      <div class="option-wrap">
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_searchMode')"
            :items="listItems.searchModeAction"
            v-model="options.searchModeAction"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option select" v-if="searchAllEnginesEnabled">
          <vn-select
            :label="getText('optionTitle_searchAllEngines')"
            :items="listItems.searchAllEnginesAction"
            v-model="options.searchAllEnginesAction"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option" v-if="pageActionEnabled">
          <vn-switch
            :label="getText('optionTitle_showPageAction')"
            v-model="options.showPageAction"
          ></vn-switch>
        </div>
      </div>
    </div>

    <div class="section-misc">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_misc') }}
      </div>
      <div class="option-wrap">
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_appTheme')"
            :items="listItems.appTheme"
            v-model="options.appTheme"
            transition="scale-transition"
          >
          </vn-select>
        </div>

        <div class="option" v-if="!$env.isAndroid">
          <vn-switch
            :label="getText('optionTitle_tabInBackgound')"
            v-model="options.tabInBackgound"
          ></vn-switch>
        </div>
        <div class="option">
          <vn-switch
            :label="getText('optionTitle_showEngineIcons')"
            v-model="options.showEngineIcons"
          ></vn-switch>
        </div>
        <div class="option" v-if="contributionsEnabled">
          <vn-switch
            :label="getText('optionTitle_showContribPage')"
            v-model="options.showContribPage"
          ></vn-switch>
        </div>
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_archiveOrgHost')"
            :items="listItems.archiveOrgHost"
            v-model="options.archiveOrgHost"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_archiveIsHost')"
            :items="listItems.archiveIsHost"
            v-model="options.archiveIsHost"
            transition="scale-transition"
          >
          </vn-select>
        </div>
      </div>
    </div>

    <div
      class="section-sponsors"
      v-if="contributionsEnabled || sponsorsEnabled"
    >
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_sponsors') }}
      </div>
      <div class="option-wrap">
        <div
          class="option sponsor-logo"
          v-if="sponsorsEnabled"
          v-for="(item, index) in sponsors"
          :key="index"
        >
          <a
            :href="getSponsorUrl(item)"
            @click.prevent="showSponsor(item)"
            @keyup.enter.prevent="showSponsor(item)"
          >
            <img :src="getSponsorLogo(item, {variant: theme})" />
          </a>
        </div>
        <div class="option button" v-if="contributionsEnabled">
          <vn-button
            class="contribute-button vn-icon--start"
            @click="showContribute"
            ><vn-icon
              src="/src/assets/icons/misc/favorite-filled.svg"
            ></vn-icon>
            {{ getText('buttonLabel_contribute') }}
          </vn-button>
        </div>
      </div>
    </div>
  </vn-app>
</template>

<script>
import {toRaw} from 'vue';
import {App, Button, Checkbox, Icon, Select, Switch} from 'vueton';
import {includes, without} from 'lodash-es';
import draggable from 'vuedraggable';

import storage from 'storage/storage';
import {
  getListItems,
  showContributePage,
  showSponsorPage,
  getAppTheme,
  getSponsorUrl,
  getSponsorLogo
} from 'utils/app';
import {getText} from 'utils/common';
import {enableContributions, enableSponsors} from 'utils/config';
import {
  optionKeys,
  archiveOrgHosts,
  archiveIsHosts,
  sponsors
} from 'utils/data';

export default {
  components: {
    'v-draggable': draggable,
    [App.name]: App,
    [Button.name]: Button,
    [Checkbox.name]: Checkbox,
    [Icon.name]: Icon,
    [Switch.name]: Switch,
    [Select.name]: Select
  },

  data: function () {
    let showInContextMenu = ['all', 'link', 'false'];
    if (this.$env.isMobile) {
      showInContextMenu = showInContextMenu.filter(item => item !== 'all');
    }

    return {
      dataLoaded: false,

      listItems: {
        ...getListItems(
          {showInContextMenu},
          {scope: 'optionValue_showInContextMenu'}
        ),
        ...getListItems(
          {
            searchAllEnginesContextMenu: ['main', 'sub', 'false']
          },
          {scope: 'optionValue_searchAllEnginesContextMenu'}
        ),
        ...getListItems(
          {searchAllEnginesAction: ['main', 'sub', 'false']},
          {
            scope: this.$env.isMobile
              ? 'optionValue_searchAllEnginesActionMobile'
              : 'optionValue_searchAllEnginesAction'
          }
        ),
        ...getListItems(
          {searchModeAction: ['tab', 'url']},
          {scope: 'optionValue_searchModeAction'}
        ),
        ...getListItems(
          {appTheme: ['auto', 'light', 'dark']},
          {scope: 'optionValue_appTheme'}
        ),
        ...getListItems(
          {archiveOrgHost: Object.keys(archiveOrgHosts)},
          {scope: 'optionValue_archiveOrgHost'}
        ),
        ...getListItems(
          {archiveIsHost: Object.keys(archiveIsHosts)},
          {scope: 'optionValue_archiveIsHost'}
        )
      },

      sponsors,

      contextMenuEnabled: true,
      searchAllEnginesEnabled: true,
      pageActionEnabled: true,
      contributionsEnabled: true,
      sponsorsEnabled: true,

      theme: '',

      options: {
        engines: [],
        disabledEngines: [],
        showInContextMenu: '',
        searchAllEnginesContextMenu: '',
        searchAllEnginesAction: '',
        showPageAction: false,
        tabInBackgound: false,
        searchModeAction: '',
        showEngineIcons: false,
        openCurrentDocContextMenu: false,
        appTheme: '',
        showContribPage: false,
        archiveOrgHost: '',
        archiveIsHost: ''
      }
    };
  },

  computed: {
    appClasses: function () {
      return {
        'show-context-menu': this.contextMenuEnabled,
        'show-sponsors': this.sponsorsEnabled || this.contributionsEnabled
      };
    }
  },

  methods: {
    getText,

    getSponsorUrl,
    getSponsorLogo,

    setup: async function () {
      const options = await storage.get(optionKeys);

      for (const option of Object.keys(this.options)) {
        this.options[option] = options[option];

        this.$watch(
          `options.${option}`,
          async function (value) {
            await storage.set({[option]: toRaw(value)});
            await browser.runtime.sendMessage({id: 'optionChange'});
          },
          {deep: true}
        );
      }

      if (this.$env.isSamsung) {
        this.searchAllEnginesEnabled = false;
      } else {
        if (this.$env.isMobile) {
          this.contextMenuEnabled = false;
        }
      }

      if (!this.$env.isFirefox || this.$env.isMobile) {
        this.pageActionEnabled = false;
      }

      this.sponsorsEnabled = enableSponsors && !!this.sponsors.length;
      this.contributionsEnabled = enableContributions;

      this.theme = await getAppTheme(options.appTheme);
      document.addEventListener('themeChange', ev => {
        this.theme = ev.detail;
      });

      this.dataLoaded = true;
    },

    engineEnabled: function (engine) {
      return !includes(this.options.disabledEngines, engine);
    },

    setEngineState: async function (engine, enabled) {
      if (enabled) {
        this.options.disabledEngines = without(
          this.options.disabledEngines,
          engine
        );
      } else {
        this.options.disabledEngines.push(engine);
      }
    },

    showContribute: async function () {
      await showContributePage();
    },

    showSponsor: async function (name) {
      await showSponsorPage({name});
    }
  },

  created: function () {
    document.title = getText('pageTitle', [
      getText('pageTitle_options'),
      getText('extensionName')
    ]);

    this.setup();
  }
};
</script>

<style lang="scss">
@use 'vueton/styles' as vueton;

@include vueton.theme-base;
@include vueton.transitions;

.v-application__wrap {
  display: grid;
  grid-row-gap: 32px;
  grid-column-gap: 48px;
  padding: 24px;
  grid-auto-rows: min-content;
  grid-auto-columns: min-content;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.25px;
  line-height: 32px;
}

.section-desc {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;

  padding-top: 8px;
  width: 272px;
}

.option-wrap {
  display: grid;
  grid-row-gap: 24px;
  padding-top: 24px;
}

.option {
  display: flex;
  align-items: center;
  height: 20px;

  &.button {
    height: 40px;
  }

  &.select,
  &.text-field {
    height: 56px;
  }
}

.section-sponsors {
  & .sponsor-logo,
  & .sponsor-logo a,
  & .sponsor-logo img {
    height: 42px;
  }

  & .sponsor-logo img {
    cursor: pointer;
  }

  & .contribute-button {
    @include vueton.theme-prop(color, primary);

    & .vn-icon {
      @include vueton.theme-prop(background-color, cta);
    }
  }

  & .button:not(:only-child) {
    margin-top: 12px;
  }
}

@media (min-width: 736px) {
  .v-application__wrap {
    grid-template-columns: minmax(280px, max-content) max-content;
    grid-template-rows: min-content 1fr;
    grid-template-areas:
      'engines toolbar'
      'engines misc';
    justify-content: center;
  }

  .show-sponsors,
  .show-context-menu {
    & .v-application__wrap {
      grid-template-rows: repeat(2, min-content) 1fr;
    }
  }

  .show-sponsors {
    & .v-application__wrap {
      grid-template-areas:
        'engines toolbar'
        'engines misc'
        'engines sponsors';
    }
  }

  .show-context-menu {
    & .v-application__wrap {
      grid-template-areas:
        'engines toolbar'
        'engines misc'
        'context-menu misc';
    }
  }

  .show-context-menu.show-sponsors {
    & .v-application__wrap {
      grid-template-rows: repeat(4, min-content) 1fr;
      grid-template-areas:
        'engines toolbar'
        'engines misc'
        'context-menu misc'
        'context-menu misc'
        'context-menu sponsors';
    }
  }

  .section-engines {
    grid-area: engines;
  }

  .section-context-menu {
    grid-area: context-menu;
  }

  .section-toolbar {
    grid-area: toolbar;
  }

  .section-misc {
    grid-area: misc;
  }

  .section-sponsors {
    grid-area: sponsors;
  }

  & .vn-checkbox,
  & .vn-switch {
    grid-template-columns: min-content;
  }
}

@media (min-width: 992px) {
  .show-sponsors,
  .show-context-menu {
    & .v-application__wrap {
      grid-template-columns: repeat(2, minmax(280px, max-content)) max-content;
      grid-template-rows: min-content 1fr;
    }
  }

  .show-sponsors {
    & .v-application__wrap {
      grid-template-areas:
        'engines toolbar sponsors'
        'engines misc sponsors';
    }
  }

  .show-context-menu {
    & .v-application__wrap {
      grid-template-areas:
        'engines context-menu misc'
        'engines toolbar misc';
    }
  }

  .show-context-menu.show-sponsors {
    & .v-application__wrap {
      grid-template-rows: repeat(2, min-content) 1fr;
      grid-template-areas:
        'engines context-menu misc'
        'engines toolbar misc'
        'engines toolbar sponsors';
    }
  }
}

@media (min-width: 1280px) {
  .show-context-menu.show-sponsors {
    & .v-application__wrap {
      grid-template-columns: repeat(3, minmax(280px, max-content)) max-content;
      grid-template-rows: min-content 1fr;
      grid-template-areas:
        'engines context-menu misc sponsors'
        'engines toolbar misc sponsors';
    }
  }
}
</style>
