import type {CSSProperties} from 'react';
import {Asset,Section,Site,SitePage} from '@/lib/validation/site';
import {resolveVariant} from '@/lib/templates/registry';
import {readable} from '@/lib/templates/themes';
import {isRequiredPageSlug} from '@/lib/generation/required-pages';
export function themeStyle(site:Site):CSSProperties {const t=site.theme;return {'--primary':t.primary,'--on-primary':readable(t.primary),'--secondary':t.secondary,'--accent':t.accent,'--site-bg':t.background,'--site-fg':t.foreground,'--site-muted':t.muted,'--site-radius':{none:'0px',small:'6px',medium:'16px',large:'28px'}[t.radius],'--site-space':{compact:'56px',comfortable:'88px',spacious:'124px'}[t.density],'--heading-font':{sans:'Arial, Helvetica, sans-serif',serif:'Georgia, serif',mono:'monospace',humanist:'Trebuchet MS, Verdana, sans-serif',display:'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif'}[t.headingFont],'--body-font':{sans:'Arial, Helvetica, sans-serif',serif:'Georgia, serif',humanist:'Trebuchet MS, Verdana, sans-serif'}[t.bodyFont],'--heading-size':{compact:'3.4rem',balanced:'4.8rem',dramatic:'6rem'}[t.scale],'--card-shadow':{none:'none',soft:'0 16px 40px #00000008',bold:'8px 8px 0 #00000022'}[t.shadow]} as CSSProperties;}
function image(asset:Asset|undefined,hero=false){return asset?<figure className="site-image"><img src={asset.url} alt={asset.alt} width={asset.width} height={asset.height} loading={hero?'eager':'lazy'} fetchPriority={hero?'high':'auto'}/></figure>:<div className="site-art" aria-label="Abstract decorative artwork"><span/><span/><span/></div>;}
const staticContactCopy:Record<string,{notice:string;thanks:string}>={
 english:{notice:'This form is a demonstration. Your message will not be sent.',thanks:'Thank you for your request. This form does not send messages.'},
 french:{notice:'Ce formulaire est une démonstration. Votre message ne sera pas envoyé.',thanks:'Merci pour votre demande. Ce formulaire n’envoie pas de messages.'},
 german:{notice:'Dieses Formular ist eine Demonstration. Ihre Nachricht wird nicht gesendet.',thanks:'Vielen Dank für Ihre Anfrage. Dieses Formular sendet keine Nachrichten.'},
 spanish:{notice:'Este formulario es una demostración. Su mensaje no se enviará.',thanks:'Gracias por su solicitud. Este formulario no envía mensajes.'},
 italian:{notice:'Questo modulo è una dimostrazione. Il messaggio non verrà inviato.',thanks:'Grazie per la richiesta. Questo modulo non invia messaggi.'},
 portuguese:{notice:'Este formulário é uma demonstração. A sua mensagem não será enviada.',thanks:'Obrigado pelo seu pedido. Este formulário não envia mensagens.'},
 ukrainian:{notice:'Це демонстраційна форма. Ваше повідомлення не буде надіслано.',thanks:'Дякуємо за ваше звернення. Ця форма не надсилає повідомлення.'},
 polish:{notice:'To formularz demonstracyjny. Twoja wiadomość nie zostanie wysłana.',thanks:'Dziękujemy za wiadomość. Ten formularz nie wysyła wiadomości.'},
 dutch:{notice:'Dit formulier is een demonstratie. Uw bericht wordt niet verzonden.',thanks:'Bedankt voor uw aanvraag. Dit formulier verstuurt geen berichten.'},
 japanese:{notice:'これはデモ用フォームです。メッセージは送信されません。',thanks:'お問い合わせありがとうございます。このフォームからメッセージは送信されません。'},
 arabic:{notice:'هذا نموذج تجريبي. لن تُرسل رسالتك.',thanks:'شكرًا على طلبك. هذا النموذج لا يرسل الرسائل.'},
};
const cookieCopy:Record<string,{heading:string;notice:string;policy:string;close:string}>={
 english:{heading:'Cookies at',notice:'This site uses browser storage to remember when you close this notice. It includes no analytics or advertising cookies by default.',policy:'Cookie policy',close:'Got it'},
 french:{heading:'Cookies chez',notice:'Ce site utilise le stockage du navigateur pour mémoriser la fermeture de cet avis. Aucun cookie publicitaire ou analytique n’est inclus par défaut.',policy:'Politique relative aux cookies',close:'Compris'},
 german:{heading:'Cookies bei',notice:'Diese Website speichert im Browser, dass Sie diesen Hinweis geschlossen haben. Standardmäßig sind keine Analyse- oder Werbe-Cookies enthalten.',policy:'Cookie-Richtlinie',close:'Verstanden'},
 spanish:{heading:'Cookies en',notice:'Este sitio guarda en el navegador que has cerrado este aviso. No incluye cookies de análisis ni publicidad de forma predeterminada.',policy:'Política de cookies',close:'Entendido'},
 italian:{heading:'Cookie su',notice:'Questo sito memorizza nel browser la chiusura di questo avviso. Per impostazione predefinita non include cookie di analisi o pubblicità.',policy:'Informativa sui cookie',close:'Ho capito'},
 portuguese:{heading:'Cookies em',notice:'Este site guarda no navegador que fechou este aviso. Por predefinição, não inclui cookies de análise ou publicidade.',policy:'Política de cookies',close:'Entendi'},
 ukrainian:{heading:'Файли cookie на сайті',notice:'Сайт зберігає у браузері відомості про закриття цього повідомлення. За замовчуванням аналітичні та рекламні файли cookie не використовуються.',policy:'Політика файлів cookie',close:'Зрозуміло'},
 polish:{heading:'Pliki cookie w',notice:'Ta witryna zapisuje w przeglądarce informację o zamknięciu tego komunikatu. Domyślnie nie używa analitycznych ani reklamowych plików cookie.',policy:'Polityka plików cookie',close:'Rozumiem'},
 dutch:{heading:'Cookies bij',notice:'Deze site onthoudt in je browser dat je deze melding hebt gesloten. Standaard bevat de site geen analyse- of advertentiecookies.',policy:'Cookiebeleid',close:'Begrepen'},
 japanese:{heading:'Cookieについて：',notice:'このサイトは、この通知を閉じたことをブラウザーに保存します。初期設定では解析用や広告用のCookieは含まれていません。',policy:'Cookieポリシー',close:'了解しました'},
 arabic:{heading:'ملفات تعريف الارتباط لدى',notice:'يحفظ هذا الموقع في المتصفح أنك أغلقت هذا الإشعار. ولا يتضمن افتراضيًا ملفات تعريف ارتباط للتحليلات أو الإعلانات.',policy:'سياسة ملفات تعريف الارتباط',close:'فهمت'},
};
export function SiteRenderer({site,page,base='',contactAction='/api/contact',staticRoot,selected,onSelect}:{site:Site;page:SitePage;base?:string;contactAction?:string;staticRoot?:string;selected?:string;onSelect?:(id:string)=>void}) {
 const link=(href:string)=>{
  if(!href.startsWith('/'))return href;
  if(staticRoot!==undefined){const [route,fragment]=href.split('#',2);return staticRoot+(route==='/'?'index.html':route.slice(1)+'/index.html')+(fragment===undefined?'':'#'+fragment);}
  return base+href;
 };
 const mainPages=site.pages.filter(p=>!isRequiredPageSlug(p.slug));
 const singlePage=mainPages.length===1;
 const homePage=mainPages[0];
 const sectionLinks=singlePage?homePage.sections.filter(s=>!['hero','cta','contact','navigation','footer'].includes(s.type)).slice(0,5).map(s=>({id:s.id,href:(page.id===homePage.id?'':'/')+'#'+s.id,title:s.type==='useCases'?'Uses':s.type==='trustStats'?'Results':s.type.charAt(0).toUpperCase()+s.type.slice(1)})):[];
 const navLinks=singlePage?sectionLinks:mainPages.filter(p=>p.slug!=='/contact').slice(0,6).map(p=>({id:p.id,href:p.slug,title:p.title}));
 const contactPage=mainPages.find(p=>p.slug==='/contact');
 const contactSection=(singlePage?homePage:page).sections.find(s=>s.type==='contact');
 const contactHref=contactPage?.slug||(contactSection?(page.id===homePage.id?'':'/')+'#'+contactSection.id:'/');
 const contactLabel=contactPage?.title||contactSection?.cta||'Contact';
 const requiredPages=site.pages.filter(p=>isRequiredPageSlug(p.slug));
 const cookiePolicy=requiredPages.find(p=>p.slug==='/cookie-policy');
 const cookieText=cookieCopy[site.language.toLowerCase()]||cookieCopy.english;
 const contactFact=(key:'phone'|'email'|'address')=>site.business.facts[key];
 const phone=contactFact('phone')?.value||'',email=contactFact('email')?.value||'',address=contactFact('address')?.value||'';
 const samplePhone=contactFact('phone')?.classification==='AI_GENERATED',sampleEmail=contactFact('email')?.classification==='AI_GENERATED',sampleAddress=contactFact('address')?.classification==='AI_GENERATED';
 const sampleVenue=sampleAddress?contactFact('address')?.source.replace(/^Google Places sample: /,''):samplePhone?contactFact('phone')?.source.replace(/^Google Places sample: /,''):'';
 const dial=phone.replace(/[^\d+]/g,'');
 return <div className={`generated-site button-${site.theme.buttonStyle} card-${site.theme.cardStyle}`} style={themeStyle(site)}>
  <a className="skip-link" href="#main-content">Skip to content</a>
  <header className={`site-nav nav-${site.navigation}`}><a className="site-brand" href={link('/')}><span className="site-mark">{site.business.name.slice(0,1)}</span>{site.business.name}</a><nav aria-label="Main navigation" className="desktop-nav">{navLinks.map(item=><a key={item.id} aria-current={!singlePage&&item.href===page.slug?'page':undefined} href={link(item.href)}>{item.title}</a>)}</nav><details className="mobile-nav"><summary>Menu</summary><nav aria-label="Mobile navigation">{[...navLinks,{id:'contact-link',href:contactHref,title:contactLabel}].map(item=><a key={item.id} href={link(item.href)}>{item.title}</a>)}</nav></details><a className="site-button nav-cta" href={link(contactHref)}>{contactLabel} <span>↗</span></a></header>
  <main id="main-content">{page.sections.map((section,index)=><div key={section.id} id={section.id} className={selected===section.id?'section-selected':''} onClick={onSelect?e=>{if((e.target as HTMLElement).closest('a,button,summary,input,textarea'))return;onSelect(section.id);}:undefined}><SectionRenderer section={section} site={site} first={index===0} link={link} contactAction={contactAction} staticContact={staticRoot!==undefined}/></div>)}</main>
  <footer className={`site-footer footer-${site.footer}`}><div><a className="site-brand" href={link('/')}>{site.business.name}</a></div><nav aria-label="Footer navigation">{mainPages.map(p=><a key={p.id} href={link(p.slug)}>{p.title}</a>)}</nav><address className="site-footer-contact" aria-label="Business contact details"><div><span className="site-footer-contact-label">Phone{samplePhone?' · sample':''}</span>{phone?(dial&&!samplePhone?<a href={'tel:'+dial}>{phone}</a>:<span>{phone}</span>):<span>Not provided</span>}</div><div><span className="site-footer-contact-label">Email{sampleEmail?' · sample':''}</span>{email?(sampleEmail?<span>{email}</span>:<a href={'mailto:'+email}>{email}</a>):<span>Not provided</span>}</div><div><span className="site-footer-contact-label">Address{sampleAddress?' · sample':''}</span><span>{address||'Not provided'}</span></div>{sampleVenue&&<small>Sample phone and address from {sampleVenue}; confirm before publishing.</small>}</address><nav aria-label="Policies and business model" className="site-policy-links">{requiredPages.map(p=><a key={p.id} href={link(p.slug)}>{p.title}</a>)}</nav><small>© {new Date().getFullYear()} {site.business.name}</small></footer>
  {cookiePolicy&&<aside className="site-cookie-banner" data-cookie-notice={cookiePolicy.id} aria-label={cookieText.policy} hidden><div><strong>{cookieText.heading} {site.business.name}</strong><p>{cookieText.notice}</p></div><div className="site-cookie-actions"><a href={link('/cookie-policy')}>{cookieText.policy}</a><button type="button" className="site-button" data-cookie-dismiss>{cookieText.close}</button></div></aside>}
 </div>;
}
export function SectionRenderer({section:s,site,first,link,contactAction,staticContact=false}:{section:Section;site:Site;first:boolean;link:(s:string)=>string;contactAction:string;staticContact?:boolean}) {
 const {composition:c,treatment}=resolveVariant(s.variant),asset=site.assets.find(a=>a.id===s.imageId);
 const Heading=first?'h1':'h2';
 const intro=<div className="section-intro">{s.type!=='hero'&&s.eyebrow&&<p className="site-eyebrow">{s.eyebrow}</p>}<Heading>{s.title}</Heading>{s.body&&<p className="section-body">{s.body}</p>}</div>;
 const cta=s.cta&&s.href?<a className="site-button" href={link(s.href)}>{s.cta}<span aria-hidden>↗</span></a>:null;
 const cards=s.items.map((item,i)=><article className="site-item" key={i}>{['numbered','steps','timeline','alternating','editorial','index'].includes(c)&&<span className="item-number">{String(i+1).padStart(2,'0')}</span>}{item.image&&image(site.assets.find(a=>a.id===item.image))}<h3>{item.title}</h3>{s.type==='testimonials'?<blockquote>{item.text}</blockquote>:<p>{item.text}</p>}{item.href&&<a className="text-link" href={link(item.href)}>{s.type==='blog'?'Read article':'Explore'} <span aria-hidden>↗</span></a>}</article>);
 const staticCopy=staticContactCopy[site.language.toLowerCase()]||staticContactCopy.english;
 const form=contactAction||staticContact?<form className="site-contact-form" action={staticContact?undefined:contactAction} method={staticContact?undefined:'post'} data-static-contact={staticContact?'':undefined}><label>Your name<input required name="name" minLength={2} maxLength={100} autoComplete="name"/></label><label>Email address<input required type="email" name="email" maxLength={254} autoComplete="email"/></label><label>Phone <span>(optional)</span><input name="phone" maxLength={50} autoComplete="tel"/></label><label>How can we help?<textarea required name="message" minLength={10} maxLength={5000} rows={4}/></label>{!staticContact&&<div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>}<p className="form-note">{staticContact?staticCopy.notice:<>Your details are used to respond to this enquiry. {site.pages.some(p=>p.slug==='/privacy-policy')&&<a href={link('/privacy-policy')}>Read the Privacy Policy</a>}.</>}</p><button className="site-button" type={staticContact?'button':'submit'} data-static-submit={staticContact?'':undefined}>Send message <span aria-hidden>↗</span></button>{staticContact&&<p className="form-note" role="status" hidden data-static-confirmation="">{staticCopy.thanks}</p>}</form>:null;
 const contactFacts=<div className="contact-facts">{['address','phone','email','hours'].map(key=>site.business.facts[key]&&site.business.facts[key].classification!=='AI_GENERATED'&&<div key={key}><small>{key}</small><p>{site.business.facts[key].value}</p></div>)}{site.business.facts.latitude&&site.business.facts.longitude&&site.business.facts.latitude.classification!=='AI_GENERATED'&&site.business.facts.longitude.classification!=='AI_GENERATED'&&<a className="text-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.business.facts.latitude.value+','+site.business.facts.longitude.value)}`} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>}</div>;
 let content;
 if(s.type==='hero'){
  const copy=<div className="hero-copy">{intro}<div className="hero-actions">{cta}</div></div>;
  content=c==='background'||c==='overlay'||c==='poster'?<><div className="hero-backdrop">{image(asset,true)}</div>{copy}</>:c==='minimal'?<>{copy}<div className="hero-rule"><span>↓ Discover more</span></div></>:c==='with-stats'?<>{copy}{image(asset,true)}</>:c==='service-grid'?<>{copy}<div className="hero-service-grid">{image(asset,true)}<div>{site.pages.filter(p=>!isRequiredPageSlug(p.slug)).slice(1,4).map(p=><a key={p.id} href={link(p.slug)}>{p.title} ↗</a>)}</div></div></>:<>{copy}{image(asset,true)}</>;
 }else if(s.type==='faq')content=<>{intro}<div className="site-items">{s.items.map((item,i)=>c==='cards'?<article className="site-item" key={i}><h3>{item.title}</h3><p>{item.text}</p></article>:<details key={i}><summary>{item.title}<span aria-hidden>+</span></summary><p>{item.text}</p></details>)}</div></>;
 else if(s.type==='contact')content=<><div>{intro}{contactFacts}</div>{form}</>;
 else if(s.type==='location')content=<>{intro}<div className="location-panel"><span className="map-pin" aria-hidden>◎</span><h3>{site.business.city}</h3><p>{site.business.country}</p>{contactFacts}</div></>;
 else if(s.type==='cta')content=<>{c==='image'&&image(asset)}<div>{intro}{cta}</div>{c==='split'&&<span className="cta-arrow" aria-hidden>↗</span>}</>;
 else if(s.type==='pricing')content=<>{intro}{s.items.length>0&&<div className="site-items">{cards}</div>}{cta}</>;
 else if(s.type==='about')content=<>{intro}{c!=='manifesto'&&image(asset)}{s.items.length>0&&<div className="site-items">{cards}</div>}{c==='manifesto'&&<div className="manifesto-signature">{site.business.name} <span>↗</span></div>}</>;
 else if(s.type==='gallery')content=<>{intro}<div className="site-items gallery-items">{(s.items.length?s.items.map(i=>site.assets.find(a=>a.id===i.image)):site.assets).filter(Boolean).map((a,i)=><div key={i}>{image(a)}</div>)}</div></>;
 else if(s.type==='navigation')content=<>{intro}<nav className="inline-links">{site.pages.map(p=><a key={p.id} href={link(p.slug)}>{p.title}</a>)}</nav></>;
 else if(s.type==='footer')content=<>{intro}<nav className="inline-links">{site.pages.map(p=><a key={p.id} href={link(p.slug)}>{p.title}</a>)}</nav>{contactFacts}</>;
 else if(c==='accordion')content=<>{intro}<div className="site-items">{s.items.map((item,i)=><details key={i}><summary>{item.title} +</summary><p>{item.text}</p></details>)}</div></>;
 else content=<>{intro}<div className="site-items">{cards}</div></>;
 return <section id={s.type==='contact'?'contact':s.type==='services'?'services':s.id} className={`site-section section-${s.type} composition-${c}${treatment?` treatment-${treatment}`:''}`}>{content}</section>;
}
