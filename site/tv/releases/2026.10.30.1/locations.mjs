const slides = folder => Array.from({length: 6}, (_, index) => ({
  src: new URL(`./assets/slides/${folder}/slide-${String(index + 1).padStart(2, '0')}.webp`, import.meta.url).href,
  durationMs: 20000,
}));
export const LOCATIONS = [
  {id: 'education-center', name: 'Education Center', slides: slides('education-center')},
  {id: 'fitness', name: 'Fitness', slides: slides('fitness')},
  {id: 'general-store', name: 'General Store', slides: slides('general-store')},
  {id: 'living-room', name: 'Living Room', slides: slides('living-room')},
  {id: 'wellness-center', name: 'Wellness Center', slides: slides('wellness-center')},
  {id: 'dignity-voices', name: 'Dignity Voices', slides: slides('living-room')},
];
export function locationFor(id) { return LOCATIONS.find(place => place.id === id) || LOCATIONS[0]; }
