// Single-flight, latest-settings-only encoded preview. No browser/UI dependency.
function createEncodedPreviewScheduler({ generate, onResult, onState, delay = 400 }) {
  let version = 0, timer = null, running = null, controller = null, pending = false;
  function pump() {
    if (running || !pending) return;
    pending = false;
    const jobVersion = version;
    controller = new AbortController();
    const signal = controller.signal;
    onState("generating");
    running = Promise.resolve().then(() => generate(signal)).then(result => {
      if (signal.aborted || jobVersion !== version) return;
      onResult(result);
      onState("ready");
    }).catch(error => {
      if (!signal.aborted && jobVersion === version) onState("error", error);
    }).finally(() => {
      running = null;
      controller = null;
      pump();
    });
  }
  function cancel() {
    version++;
    clearTimeout(timer);
    timer = null;
    pending = false;
    controller?.abort();
  }
  function request(wait = delay) {
    cancel();
    onState("stale");
    timer = setTimeout(() => { timer = null; pending = true; pump(); }, wait);
  }
  return { request, refresh: () => request(0), cancel,
    idle: async () => { while (running) await running; } };
}
