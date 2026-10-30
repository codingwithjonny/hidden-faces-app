import {LOCATIONS} from './locations.mjs';
import {savedLocation, screenKey, watchForUpdates} from './runtime.mjs';
const saved = savedLocation();
const params = new URL(location.href).searchParams;
const choose = params.has('change') || params.get('menu') === '1';
if (!choose && saved) {
  location.replace(`./display.html?location=${encodeURIComponent(saved)}`);
} else {
  const nav = document.querySelector('#locations');
  for (const place of LOCATIONS) {
    const link = document.createElement('a');
    link.href = `./display.html?location=${place.id}`;
    link.textContent = place.name;
    nav.append(link);
  }
  const links = [...nav.children];
  const initial = links[Math.max(0, LOCATIONS.findIndex(place => place.id === saved))];
  initial.focus();
  nav.addEventListener('keydown', event => {
    const key = screenKey(event);
    if (key === 'Enter') { event.preventDefault(); document.activeElement.click(); return; }
    const columns = getComputedStyle(nav).gridTemplateColumns.split(' ').length;
    const direction = {ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns}[key];
    if (direction === undefined) return;
    event.preventDefault();
    const current = Math.max(0, links.indexOf(document.activeElement));
    links[(current + direction + links.length) % links.length].focus();
  });
  window.TV = {androidBack() { initial.focus(); }};
  watchForUpdates();
}
