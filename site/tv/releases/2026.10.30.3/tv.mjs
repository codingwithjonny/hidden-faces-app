import {enableOffline} from './offline.mjs';
import {createPhotoDeck} from './photo-deck.mjs';
import {locationFor} from './locations.mjs';
import {savedLocation, screenKey, watchForUpdates, galleryURL, normalizeGallery} from './runtime.mjs';

export const ROTATION_MS = 7000;
const $ = selector => document.querySelector(selector);
const deck = createPhotoDeck({size: 4});
const walls = [$('#wall-a'), $('#wall-b')];
const slideImages = [$('#slide-a'), $('#slide-b')];
const place = locationFor(new URL(location.href).searchParams.get('location') || savedLocation());
document.title = `${place.name} · Hidden Faces TV`;
document.body.dataset.location = place.id;
try { localStorage.setItem('hf-tv-location', place.id); } catch {}

async function loadImage(src, timeoutMs = 10000) {
  const image = new Image();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { image.onload = image.onerror = null; reject(new Error('Image unavailable')); }, timeoutMs);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Image unavailable')); };
    image.src = src;
  });
}
const slideCache = new Map();
async function readySlide(slide) {
  if (!slideCache.has(slide.src)) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = setTimeout(() => controller?.abort(), 15000);
    try {
      const response = await fetch(slide.src, {cache: 'force-cache', ...(controller ? {signal: controller.signal} : {})});
      if (!response.ok) throw new Error('Slide unavailable');
      const localURL = URL.createObjectURL(await response.blob());
      try { slideCache.set(slide.src, await loadImage(localURL)); }
      catch (error) { URL.revokeObjectURL(localURL); throw error; }
    } finally { clearTimeout(timeout); }
  }
  return slideCache.get(slide.src);
}
let slideFront = 0, slideIndex = -1;
async function advanceSlide() {
  const nextIndex = (slideIndex + 1) % place.slides.length;
  const next = place.slides[nextIndex];
  try {
    const ready = await readySlide(next);
    const back = slideIndex < 0 ? slideFront : 1 - slideFront;
    slideImages[back].src = ready.src;
    slideImages[back].alt = `${place.name}, slide ${nextIndex + 1}`;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (slideIndex >= 0) slideImages[slideFront].classList.remove('visible');
    slideImages[back].classList.add('visible');
    slideFront = back; slideIndex = nextIndex;
    document.body.dataset.slide = String(slideIndex + 1);
    readySlide(place.slides[(slideIndex + 1) % place.slides.length]).catch(() => {});
    setTimeout(advanceSlide, next.durationMs);
  } catch { setTimeout(advanceSlide, 3000); }
}

let front = 0, showing = [], refreshing = false, rotating = false, hasFrame = false;
const prepared = new Map();
async function preload(photo) {
  if (prepared.get(photo.id) === photo.url) return true;
  try { await loadImage(photo.url, 5000); prepared.set(photo.id, photo.url); return true; }
  catch { return false; }
}
function buildWall(wall, photos) {
  wall.classList.remove('visible', 'leaving'); wall.setAttribute('aria-hidden', 'true');
  wall.replaceChildren(); wall.dataset.count = String(photos.length);
  for (const photo of photos) {
    const tile = document.createElement('div'); tile.className = 'tile'; tile.dataset.photoId = photo.id;
    const img = document.createElement('img'); img.src = photo.url;
    img.alt = photo.caption || 'A shared moment from Hidden Faces';
    tile.append(img); wall.append(tile);
  }
}
async function rotate() {
  if (rotating || document.hidden || !deck.count) return;
  rotating = true;
  try {
    const next = deck.next(), ready = await Promise.all(next.map(preload));
    const photos = next.filter((photo, index) => ready[index] && deck.has(photo.id));
    if (!photos.length) return;
    const back = hasFrame ? 1 - front : front; buildWall(walls[back], photos);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (hasFrame) { walls[front].classList.remove('visible'); walls[front].classList.add('leaving'); walls[front].setAttribute('aria-hidden', 'true'); }
    walls[back].classList.add('visible'); walls[back].setAttribute('aria-hidden', 'false');
    front = back; hasFrame = true; showing = photos;
  } finally { rotating = false; }
}
async function refresh() {
  if (refreshing || document.hidden) return;
  refreshing = true;
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = setTimeout(() => { if (controller) controller.abort(); }, 15000);
  try {
    const response = await fetch(galleryURL(), {cache: 'no-store', ...(controller ? {signal: controller.signal} : {})});
    if (!response.ok) throw new Error('Gallery unavailable');
    const gallery = await response.json();
    deck.sync(normalizeGallery(gallery));
    for (const id of prepared.keys()) if (!deck.has(id)) prepared.delete(id);
    // Remove moderated photos from both the visible and fading layers.
    for (const tile of document.querySelectorAll('.tile')) if (!deck.has(tile.dataset.photoId)) tile.remove();
    if (!deck.count) {
      showing = []; hasFrame = false;
      for (const wall of walls) { wall.classList.remove('visible', 'leaving'); wall.replaceChildren(); }
    } else if (!hasFrame || showing.some(photo => !deck.has(photo.id))) await rotate();
    document.body.dataset.feed = 'connected';
  } catch { document.body.dataset.feed = 'reconnecting'; }
  finally { clearTimeout(timeout); refreshing = false; }
}
setInterval(rotate, ROTATION_MS); setInterval(refresh, 5000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
document.addEventListener('keydown', event => {
  if (['Escape', 'Backspace', 'ContextMenu', 'm', 'M'].includes(screenKey(event))) { event.preventDefault(); returnToMenu(); }
});
function returnToMenu() { location.href = './?menu=1'; }
window.TV = {androidBack: returnToMenu};
watchForUpdates();
advanceSlide(); refresh();
// Keep the complete selected deck in memory as local image URLs as well.
for (const slide of place.slides) readySlide(slide).catch(() => {});

enableOffline();
