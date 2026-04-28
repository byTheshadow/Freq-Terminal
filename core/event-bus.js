// core/event-bus.js
// 模块间通信总线，所有模块只通过这里通信，不直接互相 import

const EventBus = (() => {
  const listeners = {};

  return {
    on(event, callback) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    },

    off(event, callback) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
      if (!listeners[event]) return;
      listeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error(`[FreqTerminal] EventBus error on "${event}":`, e); }
      });
    },

    once(event, callback) {
      const wrapper = (data) => {
        callback(data);
        this.off(event, wrapper);
      };
      this.on(event, wrapper);
    }
  };
})();

export default EventBus;
