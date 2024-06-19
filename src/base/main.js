import storage from 'storage/storage';
import {runOnce} from 'utils/common';

function main() {
  async function checkTask() {
    const {taskRegistry} = await storage.get('taskRegistry');
    if (Date.now() - taskRegistry.lastTaskStart < 600000) {
      await browser.runtime.sendMessage({id: 'taskRequest'});
    }
  }

  if (window.top === window) {
    checkTask();
  }
}

if (runOnce('baseModule')) {
  main();
}
