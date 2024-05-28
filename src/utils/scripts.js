function makeDocumentVisibleScript(eventName) {
  let visibilityState = document.visibilityState;

  function updateVisibilityState(ev) {
    visibilityState = ev.detail;
  }

  document.addEventListener(eventName, updateVisibilityState, {
    capture: true
  });

  let lastCallTime = 0;
  window.requestAnimationFrame = new Proxy(window.requestAnimationFrame, {
    apply(target, thisArg, argumentsList) {
      if (visibilityState === 'visible') {
        return Reflect.apply(target, thisArg, argumentsList);
      } else {
        const currentTime = Date.now();
        const callDelay = Math.max(0, 16 - (currentTime - lastCallTime));

        lastCallTime = currentTime + callDelay;

        const timeoutId = window.setTimeout(function () {
          argumentsList[0](performance.now());
        }, callDelay);

        return timeoutId;
      }
    }
  });

  window.cancelAnimationFrame = new Proxy(window.cancelAnimationFrame, {
    apply(target, thisArg, argumentsList) {
      if (visibilityState === 'visible') {
        return Reflect.apply(target, thisArg, argumentsList);
      } else {
        window.clearTimeout(argumentsList[0]);
      }
    }
  });

  Object.defineProperty(document, 'visibilityState', {
    get() {
      return 'visible';
    }
  });

  Object.defineProperty(document, 'hidden', {
    get() {
      return false;
    }
  });

  Document.prototype.hasFocus = function () {
    return true;
  };

  function stopEvent(ev) {
    ev.preventDefault();
    ev.stopImmediatePropagation();
  }

  window.addEventListener('pagehide', stopEvent, {capture: true});
  window.addEventListener('blur', stopEvent, {capture: true});

  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new PageTransitionEvent('pageshow'));
  window.dispatchEvent(new FocusEvent('focus'));
}

function yandexServiceObserverScript(eventName) {
  let stop;

  const checkService = function () {
    if (window.Ya?.reactBus?.emit) {
      window.clearTimeout(timeoutId);
      document.dispatchEvent(new Event(eventName));
    } else if (!stop) {
      window.setTimeout(checkService, 200);
    }
  };

  const timeoutId = window.setTimeout(function () {
    stop = true;
  }, 60000); // 1 minute

  checkService();
}

const scriptFunctions = {
  makeDocumentVisible: makeDocumentVisibleScript,
  yandexServiceObserver: yandexServiceObserverScript
};

function getScriptFunction(func) {
  return scriptFunctions[func];
}

export {getScriptFunction};
