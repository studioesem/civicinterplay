// Our own images on the Readings cards.
// Three signature images by theme, plus specific ones where a reading
// connects to one of our stories. Captions link to that story.
// Publisher artwork is still not used (see ReadingCard.astro).

type Img = { src: string; pos?: string; link?: [string, string]; dots: [string, number, number][] };

const workshop: Img = { src: '/images/people/workshop.webp', pos: '50% 40%',
  dots: [['#B47DB5', 92, 12], ['#A8C1CE', 8, 86]] };
const spiral: Img = { src: '/images/spiral-staircase.webp', pos: '50% 60%',
  dots: [['#A27C4E', 90, 14], ['#13608A', 10, 84]] };
const deCeuvel: Img = { src: '/images/people/metabolic.webp', pos: '50% 50%',
  link: ['/at-de-ceuvel/', 'They gathered inside a makeshift structure at De Ceuvel.'],
  dots: [['#9BA557', 90, 84], ['#E1EADD', 8, 14]] };
const dataCentre: Img = { src: '/images/people/data-centre.webp', pos: '50% 50%',
  link: ['/sovereignties/', 'Data Centres Transparency Project'],
  dots: [['#AB5A6D', 90, 14], ['#A8C1CE', 10, 86]] };
const protocols: Img = { src: '/images/people/civic-economy-protocols.webp', pos: '50% 50%',
  link: ['/at-de-ceuvel/', 'They gathered inside a makeshift structure at De Ceuvel.'],
  dots: [['#7A7F66', 92, 84], ['#B47DB5', 50, 8]] };

const byTitle: Record<string, Img> = {
  'Magnificent Humanity: Civic AI in Dr Duncan\'s City': protocols,
  'EuroStack: A European Alternative for Digital Sovereignty': dataCentre,
  'ENABLED: Innovation for data ecosystems and sovereignty': dataCentre,
};

export function readingImage(title: string, tags: string[]): Img {
  if (byTitle[title]) return byTitle[title];
  if (tags.includes('more-than-human')) return deCeuvel;
  if (tags.includes('participation')) return workshop;
  return spiral;
}
