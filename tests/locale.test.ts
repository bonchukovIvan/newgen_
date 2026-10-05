import {describe,expect,it} from 'vitest';
import {languageCode} from '@/lib/seo';

describe('generated site language tags',()=>{
 it('combines the selected language with the business country',()=>{
  expect(languageCode('English','United States')).toBe('en-US');
  expect(languageCode('English','United Kingdom')).toBe('en-GB');
  expect(languageCode('French','Canada')).toBe('fr-CA');
  expect(languageCode('Ukrainian','Ukraine')).toBe('uk-UA');
  expect(languageCode('en-us','Germany')).toBe('en-DE');
 });
 it('uses a language-only tag when the country cannot be resolved',()=>{
  expect(languageCode('English','Unknown place')).toBe('en');
  expect(languageCode('English')).toBe('en');
 });
});
