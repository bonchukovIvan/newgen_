export const variants = {
  hero: ['split','centered','background','editorial','with-stats','service-grid','minimal','overlay'],
  navigation: ['inline','centered','split','stacked'],
  trustStats: ['inline','cards','feature','sidebar','banner'],
  about: ['split','editorial','overlap','timeline','manifesto','mosaic'],
  services: ['cards','list','bento','alternating','spotlight','columns','numbered','accordion','tiles','editorial'],
  features: ['grid','split','checklist','bento','spotlight','rows'],
  process: ['steps','timeline','cards','alternating','editorial'],
  gallery: ['grid','masonry','feature','strip','collage','editorial'],
  team: ['cards','list','spotlight','editorial'],
  testimonials: ['cards','feature','columns','editorial','strip'],
  pricing: ['cards','comparison','list','featured','minimal','editorial'],
  faq: ['accordion','columns','split','cards'],
  cta: ['banner','split','centered','minimal','editorial','card','image','stacked'],
  contact: ['split','centered','sidebar','cards','minimal','editorial'],
  footer: ['columns','minimal','centered','split','editorial'],
  blog: ['cards','list','feature','editorial'],
  location: ['split','cards','centered','editorial'],
  logos: ['strip','grid','centered','sidebar'],
} as const;
export type SectionType = keyof typeof variants;
export type Composition = typeof variants[SectionType][number];
export const sectionTypes = Object.keys(variants) as SectionType[];
export const sectionRegistry = Object.fromEntries(sectionTypes.flatMap(type => variants[type].map(composition => [`${type}-${composition}`, { type, composition }])));
export function resolveVariant(id: string) { const entry = sectionRegistry[id]; if (!entry) throw new Error(`Unknown component: ${id}`); return entry; }
export function variantFor(type: SectionType, seed = 0) { return `${type}-${variants[type][Math.abs(seed) % variants[type].length]}`; }
