import {LOCATIONS} from './locations.mjs';
export const BUILD_ID = '2026.10.30.3';
const oldLocations = {education: 'education-center', gym: 'fitness', store: 'general-store', living: 'living-room', wellness: 'wellness-center', podcast: 'dignity-voices'};
export function savedLocation(storage = localStorage) {
  try {
    const saved = storage.getItem('hf-tv-location') || storage.getItem('hiddenFacesTvProfile');
    const id = oldLocations[saved] || saved;
    return LOCATIONS.some(place => place.id === id) ? id : null;
  } catch { return null; }
}
export function screenKey(event) {
  const legacy = {19: 'ArrowUp', 20: 'ArrowDown', 21: 'ArrowLeft', 22: 'ArrowRight', 23: 'Enter', 66: 'Enter', 82: 'ContextMenu', 4: 'Escape'};
  return event.key && event.key !== 'Unidentified' ? event.key : legacy[event.keyCode] || '';
}
export function galleryURL(now = Date.now()) {
  return `https://res.cloudinary.com/ayyh0pzg/image/list/hiddenfaces2026.json?_=${Math.floor(now / 10000)}`;
}
export function normalizeGallery(gallery) {
  if (!Array.isArray(gallery.resources)) throw new Error('Invalid photo feed');
  return gallery.resources.filter(photo => photo && typeof photo.public_id === 'string' && photo.public_id).map(photo => ({
    id: photo.public_id,
    url: `https://res.cloudinary.com/ayyh0pzg/image/upload/q_auto,f_auto/${photo.public_id.split('/').map(encodeURIComponent).join('/')}.jpg`,
    caption: String(photo.context?.custom?.caption || '').trim().slice(0, 80),
    createdAt: photo.created_at || '',
  }));
}
export function watchForUpdates() {
  let checking = false;
  async function check() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const url = new URL('../../version.json', import.meta.url);
      url.searchParams.set('_', Date.now());
      const response = await fetch(url, {cache: 'no-store'});
      if (!response.ok) return;
      const version = await response.json();
      if (typeof version.build === 'string' && version.build !== BUILD_ID) {
        const next = new URL(location.href);
        next.searchParams.set('v', version.build);
        location.replace(next.href);
      }
    } catch {} finally { checking = false; }
  }
  setInterval(check, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  check();
}
