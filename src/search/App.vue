<template>
  <vn-app v-show="dataLoaded">
    <div class="page-overlay">
      <div class="error-content" v-if="error">
        <vn-icon
          class="error-icon"
          src="/src/assets/icons/misc/error.svg"
        ></vn-icon>
        <div class="error-text">{{ error }}</div>
      </div>

      <img
        v-if="showSpinner && !error"
        class="spinner"
        src="/src/assets/icons/misc/spinner.svg"
      />
    </div>
  </vn-app>
</template>

<script>
import {App, Icon} from 'vueton';

import {validateUrl} from 'utils/app';
import {getText} from 'utils/common';
import {searchPermacc} from 'utils/engines';

export default {
  components: {
    [App.name]: App,
    [Icon.name]: Icon
  },

  data: function () {
    return {
      dataLoaded: false,

      error: '',
      showSpinner: false,
      engine: ''
    };
  },

  methods: {
    setup: async function () {
      const storageId = new URL(window.location.href).searchParams.get('id');

      const task = await browser.runtime.sendMessage({
        id: 'storageRequest',
        asyncResponse: true,
        saveReceipt: true,
        storageId
      });

      if (task) {
        this.showSpinner = true;
        this.dataLoaded = true;

        this.engine = task.search.engine;

        document.title = getText('pageTitle', [
          getText(`optionTitle_${this.engine}`),
          getText('extensionName')
        ]);

        try {
          const doc = await browser.runtime.sendMessage({
            id: 'storageRequest',
            asyncResponse: true,
            saveReceipt: true,
            storageId: task.docId
          });

          if (doc) {
            await this.search({
              session: task.session,
              search: task.search,
              doc
            });
          } else {
            this.error = getText(
              'error_sessionExpiredEngine',
              getText(`engineName_${this.engine}`)
            );
          }
        } catch (err) {
          this.error = getText(
            'error_engine',
            getText(`engineName_${this.engine}`)
          );

          console.log(err.toString());
          throw err;
        }
      } else {
        this.error = getText('error_sessionExpired');
        this.dataLoaded = true;
      }
    },

    search: async function ({session, search, doc} = {}) {
      if (this.engine === 'permacc') {
        const tabUrl = await searchPermacc({session, search, doc});

        if (validateUrl(tabUrl)) {
          window.location.replace(tabUrl);
        } else {
          this.error = getText('error_noResults');
        }
      }
    }
  },

  created: function () {
    this.setup();
  }
};
</script>

<style lang="scss">
@use 'vueton/styles' as vueton;

@include vueton.theme-base;
@include vueton.transitions;

html,
body,
.v-application,
.v-application__wrap {
  width: 100%;
}

body,
.v-application__wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 8px;
}

.spinner {
  width: 36px;
  height: 36px;
}

.error-content {
  display: flex;
  align-items: center;
  margin: auto;
  padding: 16px;

  & .error-icon {
    width: 48px;
    height: 48px;
    min-width: 48px;
    min-height: 48px;
    margin-right: 24px;
    @include vueton.theme-prop(background-color, error);
  }

  & .error-text {
    @include vueton.md2-typography(subtitle1);
    max-width: 520px;
  }
}
</style>
