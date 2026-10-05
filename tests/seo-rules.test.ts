import {describe,it,expect} from 'vitest';
import {starterSite,demoBrief} from '@/lib/templates/starter';
import {validateSearchMetadata} from '@/lib/ai/seo-rules';

describe('generated search metadata',()=>{
 const site=starterSite(demoBrief);
 const page=structuredClone(site.pages[0]);
 page.sections[0].title='PC gaming sessions and console play in Manchester';
 page.seo.title='Gaming lounge and esports events | NovaForge Esports';
 page.seo.description='Explore console gaming and group sessions at NovaForge Esports in Manchester. 🎮 Discover flexible gaming spaces, plan a visit with friends, and ask about current availability.';

 it('accepts the required title, description, and H1 shape',()=>{
  expect(Array.from(page.seo.description)).toHaveLength(175);
  expect(()=>validateSearchMetadata(page,site.business.name)).not.toThrow();
 });

 it('rejects duplicate headings, missing brand suffixes, and malformed descriptions',()=>{
  const changed=structuredClone(page);
  changed.sections[0].title=changed.seo.title;
  expect(()=>validateSearchMetadata(changed,site.business.name)).toThrow();
  changed.sections[0].title=page.sections[0].title;
  changed.seo.title='Gaming lounge and esports events';
  expect(()=>validateSearchMetadata(changed,site.business.name)).toThrow();
  changed.seo.title=page.seo.title;
  changed.seo.description=page.seo.description.replace('🎮','and');
  expect(()=>validateSearchMetadata(changed,site.business.name)).toThrow();
 });
});
