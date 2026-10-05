import {afterEach,describe,expect,it,vi} from 'vitest';
import {suggestRandomBusinessContact} from '@/lib/google/places';

vi.mock('@/lib/usage',()=>({track:vi.fn()}));
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});

const addressComponents=[
 {longText:'3',types:undefined},
 {longText:'Manchester',types:['locality']},
 {longText:'United Kingdom',types:['country']},
];
const venue={id:'venue-1',displayName:{text:'Example Arcade'},formattedAddress:'3 Market Street, Manchester, United Kingdom',addressComponents};

describe('generated Google Places contact',()=>{
 it('falls back to other businesses in the selected country when the category has no phone',async()=>{
  vi.stubEnv('GOOGLE_PLACES_API_KEY','test-key');
  const fetchMock=vi.fn()
   .mockResolvedValueOnce(new Response(JSON.stringify({places:[venue]}),{status:200}))
   .mockResolvedValueOnce(new Response(JSON.stringify({places:[{...venue,internationalPhoneNumber:'+44 161 555 0123'}]}),{status:200}));
  vi.stubGlobal('fetch',fetchMock);
  expect(await suggestRandomBusinessContact('Gaming club','United Kingdom','project-1')).toEqual({name:'Example Arcade',address:venue.formattedAddress,city:'Manchester',country:'United Kingdom',phone:'+44 161 555 0123'});
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).textQuery).toBe('businesses in United Kingdom');
 });

 it('gets a phone from the same venue details when searches omit phone fields',async()=>{
  vi.stubEnv('GOOGLE_PLACES_API_KEY','test-key');
  const fetchMock=vi.fn()
   .mockResolvedValueOnce(new Response(JSON.stringify({places:[venue]}),{status:200}))
   .mockResolvedValueOnce(new Response(JSON.stringify({places:[]}),{status:200}))
   .mockResolvedValueOnce(new Response(JSON.stringify({places:[]}),{status:200}))
   .mockResolvedValueOnce(new Response(JSON.stringify({...venue,nationalPhoneNumber:'0161 555 0123'}),{status:200}));
  vi.stubGlobal('fetch',fetchMock);
  expect(await suggestRandomBusinessContact('Gaming club','United Kingdom','project-1')).toMatchObject({name:'Example Arcade',address:venue.formattedAddress,phone:'0161 555 0123'});
  expect(fetchMock.mock.calls[3][0]).toBe('https://places.googleapis.com/v1/places/venue-1');
 });
});
