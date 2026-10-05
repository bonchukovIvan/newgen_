export const variants = {
  hero: ['split','centered','background','editorial','with-stats','service-grid','minimal','overlay','reverse','poster','frame','split--framed','centered--tinted','editorial--offset','minimal--ruled','reverse--compact'],
  navigation: ['inline','centered','split','stacked','inline--framed','centered--tinted','split--offset','stacked--ruled','inline--compact'],
  trustStats: ['inline','cards','feature','sidebar','banner','inline--framed','cards--tinted','feature--offset','sidebar--ruled','banner--compact'],
  about: ['split','editorial','overlap','timeline','manifesto','mosaic','portrait','framed','split--framed','editorial--tinted','overlap--offset','portrait--ruled','mosaic--compact'],
  services: ['cards','list','bento','alternating','spotlight','columns','numbered','accordion','tiles','editorial','rail','index','asymmetric','cards--framed','list--tinted','bento--offset','numbered--ruled','asymmetric--compact'],
  features: ['grid','split','checklist','bento','spotlight','rows','grid--framed','split--tinted','checklist--offset','rows--ruled','spotlight--compact'],
  audience: ['cards','split','list','spotlight','cards--framed','split--tinted','list--ruled','spotlight--compact'],
  useCases: ['cards','editorial','alternating','bento','cards--tinted','editorial--offset','alternating--ruled','bento--compact'],
  highlights: ['grid','feature','rows','bento','grid--framed','feature--tinted','rows--ruled','bento--compact'],
  comparison: ['columns','rows','cards','editorial','columns--framed','rows--tinted','cards--offset','editorial--compact'],
  process: ['steps','timeline','cards','alternating','editorial','steps--framed','timeline--tinted','cards--offset','alternating--ruled','editorial--compact'],
  gallery: ['grid','masonry','feature','strip','collage','editorial','panorama','grid--framed','masonry--tinted','feature--offset','strip--ruled','panorama--compact'],
  team: ['cards','list','spotlight','editorial','cards--framed','list--tinted','spotlight--offset','editorial--ruled','cards--compact'],
  testimonials: ['cards','feature','columns','editorial','strip','cards--framed','feature--tinted','columns--offset','editorial--ruled','strip--compact'],
  pricing: ['cards','comparison','list','featured','minimal','editorial','cards--framed','comparison--tinted','list--offset','featured--ruled','minimal--compact'],
  faq: ['accordion','columns','split','cards','accordion--framed','columns--tinted','split--offset','cards--ruled','accordion--compact'],
  cta: ['banner','split','centered','minimal','editorial','card','image','stacked','inset','contrast','split--framed','centered--tinted','image--offset','minimal--ruled','editorial--compact'],
  contact: ['split','centered','sidebar','cards','minimal','editorial','split--framed','centered--tinted','sidebar--offset','cards--ruled','editorial--compact'],
  footer: ['columns','minimal','centered','split','editorial','columns--framed','minimal--tinted','centered--offset','split--ruled','editorial--compact'],
  blog: ['cards','list','feature','editorial','cards--framed','list--tinted','feature--offset','editorial--ruled','cards--compact'],
  location: ['split','cards','centered','editorial','split--framed','cards--tinted','centered--offset','editorial--ruled','split--compact'],
  logos: ['strip','grid','centered','sidebar','strip--framed','grid--tinted','centered--offset','sidebar--ruled'],
} as const;
export type SectionType = keyof typeof variants;
export type Composition = typeof variants[SectionType][number];
export const sectionTypes = Object.keys(variants) as SectionType[];
export const sectionRegistry = Object.fromEntries(sectionTypes.flatMap(type => variants[type].map(variant => {
 const [composition, treatment] = variant.split('--');
 return [`${type}-${variant}`, { type, composition, treatment: treatment || '' }];
})));
export function resolveVariant(id: string) { const entry = sectionRegistry[id]; if (!entry) throw new Error(`Unknown component: ${id}`); return entry; }
export function variantFor(type: SectionType, seed = 0) { return `${type}-${variants[type][Math.abs(seed) % variants[type].length]}`; }
