import {BUILD_ID} from './runtime.mjs';

export function enableOffline() {
  const base = new URL('../../', import.meta.url);
  const messages = {
    saving: 'Saving slides for offline use… Keep this TV online until finished.',
    ready: 'Slides saved for offline use.',
    retrying: 'Slides are not saved yet. Keep this TV online; saving will retry.',
    unsupported: 'Offline saving is unavailable on this device.',
  };
  function state(value) {
    document.body.dataset.offline = value;
    const label = document.querySelector('#offline-status');
    if (label) label.textContent = messages[value];
  }
  if (!('serviceWorker' in navigator) || !('caches' in window)) { state('unsupported'); return; }
  let registration, starting = false;
  state('saving');
  function ask(worker) {
    if (!worker) return;
    const channel = new MessageChannel();
    const timeout = setTimeout(() => channel.port1.close(), 3000);
    channel.port1.onmessage = event => {
      clearTimeout(timeout); channel.port1.close();
      if (event.data?.type === 'OFFLINE_READY' && event.data.build === BUILD_ID) state('ready');
    };
    worker.postMessage({type: 'OFFLINE_STATUS'}, [channel.port2]);
  }
  async function start() {
    if (starting || document.body.dataset.offline === 'ready') return;
    starting = true;
    try {
      registration = await navigator.serviceWorker.register(new URL('offline-worker.js', base), {scope: base.href, updateViaCache: 'none'});
      ask(registration.active);
      const installing = registration.installing;
      if (installing) installing.addEventListener('statechange', () => {
        if (installing.state === 'activated') ask(installing);
        if (installing.state === 'redundant' && document.body.dataset.offline !== 'ready') state('retrying');
      });
      navigator.serviceWorker.ready.then(active => ask(active.active));
      await registration.update();
    } catch { if (document.body.dataset.offline !== 'ready') state('retrying'); }
    finally { starting = false; }
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => ask(navigator.serviceWorker.controller));
  window.addEventListener('online', start);
  setInterval(start, 30000);
  setTimeout(() => { if (document.body.dataset.offline === 'saving') state('retrying'); }, 45000);
  start();
}
