import {test,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';

test('Generated business: account, wizard, generation, editing, images, preview, contact and export',async({page,request})=>{
 const stamp=Date.now();
 await page.goto('/login');await page.getByRole('button',{name:'Create an account',exact:true}).click();
 await page.getByLabel('Your name',{exact:true}).fill('Acceptance tester');
 await page.getByLabel('Email address',{exact:true}).fill(`acceptance-${stamp}@example.test`);
 await page.getByLabel('Password',{exact:true}).fill(`Acceptance-${stamp}-secure`);
 await page.getByRole('button',{name:'Create your account',exact:true}).click();
 await expect(page.getByRole('button',{name:'New website',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'New website',exact:true}).click();
 await page.getByLabel('Industry / category').fill('Gaming lounge');
 await page.getByLabel('Country',{exact:true}).fill('United Kingdom');
 await page.getByLabel('Number of pages').fill('6');
 await page.getByRole('button',{name:'Generate website',exact:true}).click();await expect(page).toHaveURL(/\/projects\//);
 const id=page.url().split('/').pop()!;
 await expect(page.getByRole('button',{name:'Export site',exact:true})).toBeVisible({timeout:120000});
 const getProject=async()=>{const response=await page.request.get('/api/projects/'+id);expect(response.ok()).toBeTruthy();return response.json();};
 let p=await getProject();expect(p.site.pages).toHaveLength(10);expect(p.site.assets.length).toBeGreaterThan(0);
 await page.locator('.section-list>div').first().locator('button').first().click();
 await page.getByLabel('Heading',{exact:true}).fill('Let’s play together.');
 await page.getByLabel('Composition',{exact:true}).selectOption('hero-centered');
 await expect.poll(async()=>(await getProject()).site.pages[0].sections[0].title).toBe('Let’s play together.');
 await page.reload();await expect(page.locator('.preview-frame h1')).toHaveText('Let’s play together.');
 await page.locator('.section-list>div').first().locator('button').first().click();
 const before=await getProject();
 await page.getByRole('button',{name:'Regenerate section',exact:true}).click();
 await expect.poll(async()=>(await getProject()).version,{timeout:120000}).toBeGreaterThan(before.version);
 p=await getProject();expect(p.site.pages[1]).toEqual(before.site.pages[1]);expect(p.site.pages[0].sections[0].title).not.toBe(before.site.pages[0].sections[0].title);
 await page.getByRole('button',{name:'Images',exact:true}).click();
 const previousImage=p.site.pages[0].sections[0].imageId;
 await page.getByRole('button',{name:'Regenerate image',exact:true}).first().click();
 await expect.poll(async()=>(await getProject()).site.pages[0].sections[0].imageId,{timeout:120000}).not.toBe(previousImage);
 p=await getProject();
 await page.getByRole('button',{name:'Pages',exact:true}).click();
 page.once('dialog',dialog=>dialog.accept('Team'));
 await page.getByRole('button',{name:'Add page',exact:true}).click();
 await expect.poll(async()=>(await getProject()).site.pages.length).toBe(11);
 const bad=structuredClone((await getProject()).site);bad.pages[0].sections[0].href='/missing-page';
 const invalidSave=await page.request.patch('/api/projects/'+id,{data:{site:bad,version:(await getProject()).version}});expect(invalidSave.status()).toBe(400);
 // A second account cannot read or mutate this project.
 const anonymous=await request.get('/api/projects/'+id);expect(anonymous.status()).toBe(401);
 await page.goto('/preview/'+id);await expect(page.locator('.generated-site h1')).toBeVisible();
 expect(await page.locator('meta[name=description]').getAttribute('content')).toBeTruthy();
 const ld=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent()||'null');expect(Array.isArray(ld)).toBe(true);
 for(const width of [375,768,1024,1440]){await page.setViewportSize({width,height:1000});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
 const sources=await page.locator('.generated-site img').evaluateAll(nodes=>nodes.map(n=>(n as HTMLImageElement).src));
 for(const src of sources){const response=await page.request.get(src);expect(response.ok()).toBeTruthy();expect(response.headers()['content-type']).toBe('image/webp');}
 await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Services',exact:true}).click();await expect(page).toHaveURL(/\/services$/);
 await page.goto('/preview/'+id+'/contact');await page.getByLabel('Your name',{exact:true}).fill('Interested visitor');await page.getByLabel('Email address').fill('visitor@example.test');await page.getByLabel('How can we help?').fill('Please tell me about private esports events.');await page.getByRole('button',{name:/Send message/}).click();await expect(page.getByRole('heading',{name:'Thank you for getting in touch.'})).toBeVisible();
 p=await getProject();expect(p.submissions[0].message).toContain('private esports');
 const exported=await page.request.get('/api/projects/'+id+'/export');expect(exported.ok(),await exported.text().then(t=>t.slice(0,300))).toBeTruthy();expect(exported.headers()['content-type']).toContain('zip');
 await mkdir('test-results',{recursive:true});await writeFile('test-results/acceptance-website.zip',await exported.body());await writeFile('test-results/acceptance-project.json',JSON.stringify({id,version:p.version}));
 await page.goto('/');await page.screenshot({path:'test-results/dashboard-desktop.png',fullPage:true});await page.setViewportSize({width:375,height:850});await page.screenshot({path:'test-results/dashboard-mobile.png',fullPage:true});
});
