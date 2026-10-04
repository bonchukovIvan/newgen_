import {describe,expect,it} from 'vitest';
import {assertWritingQuality,pageCopy,sectionCopy,writingIssue} from '@/lib/ai/writing-quality';
import {starterSite,demoBrief} from '@/lib/templates/starter';

describe('generated writing quality',()=>{
 it('flags clear AI artifacts and leaves ordinary copy alone',()=>{
  expect(writingIssue('Moreover, we leverage seamless solutions for local businesses. Experts believe this marks a pivotal moment for the industry.')).toContain('AI vocabulary');
  expect(writingIssue('Book a consultation about hair colour.')).toBeUndefined();
 });
 it('protects supplied wording while checking new prose',()=>{
  expect(()=>assertWritingQuality(['Seamless Studio'],['Seamless Studio'])).not.toThrow();
  expect(()=>assertWritingQuality(['Our seamless services help people plan visits and choose the right option for their needs.'],['Seamless Studio'])).toThrow('Writing quality');
 });
 it('includes metadata, CTAs, FAQ answers, and section copy',()=>{
  const page=starterSite(demoBrief).pages[0];
  page.seo.description='Our seamless service makes every visit easier to plan.';
  page.sections[0].cta='Get in touch';
  expect(pageCopy(page)).toContain('Our seamless service makes every visit easier to plan.');
  expect(sectionCopy(page.sections[0])).toContain('Get in touch');
  expect(()=>assertWritingQuality(pageCopy(page))).toThrow('Writing quality');
 });
});
