'use strict';

var Utils = {
  formatTime: total => {
    let minutes = 0;
    let seconds = 0;

    if (total > 0) {
      minutes += Math.floor(total / 60);
      total %= 60;
    }

    seconds = Math.round(total);

    if (seconds == 60) {
      minutes += 1;
      seconds = 0;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  },

  cancellable: () => {
    var cancelController = null, onabortCallbacks;

    function createController() {
      onabortCallbacks = [];
      const controller = new AbortController();
      controller.signal.onabort = () => {
        onabortCallbacks.forEach(cb => cb());
      };
      return controller;
    }

    return {
      reset: () => {
        cancelController = null;
      },
      onCancel: (callback) => {
        cancelController = cancelController || createController();
        onabortCallbacks.unshift(callback);
      },
      cancel: () => {
        if (cancelController) {
          cancelController.abort();
          cancelController = null;
        }
      }
    };
  },

  timer: (seconds, onTick, cancellable) => {
    var intervalId;

    cancellable.onCancel(() => {
      clearInterval(intervalId);
    });

    onTick(seconds);

    intervalId = setInterval(() => {
      seconds--;

      if (seconds === 0) {
        clearInterval(intervalId);
        cancellable.reset();
      }

      onTick(seconds);
    }, 1000);
  }
};

// READ-ONLY TOKEN
var TOKEN = 'be21195231d946b680453e48456d6e806a34c0456b8c13804aa797cb2c560db1';
