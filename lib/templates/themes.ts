import type { Theme } from '@/lib/validation/site';
export const presets = ['Modern Corporate','Premium Luxury','Minimal','Startup','Professional Services','Tech','Gaming','Industrial','Medical','Beauty','Restaurant','Creative Agency','Financial','Real Estate','Automotive','Local Service Business'];
function luminance(hex:string) { const c=hex.slice(1).match(/.{2}/g)!.map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4); return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722; }
export function contrast(a:string,b:string) {const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function readable(bg:string) {return contrast(bg,'#ffffff')>=4.5?'#ffffff':'#101118';}
export function ensureContrast(t:Theme):Theme { return {...t,foreground:contrast(t.background,t.foreground)>=4.5?t.foreground:readable(t.background),muted:contrast(t.background,t.muted)>=4.5?t.muted:readable(t.background)}; }
export function createTheme(style:string,dark:boolean,primary:string):Theme {
 const luxury=/Luxury|Beauty|Restaurant|Real Estate/.test(style), angular=/Gaming|Industrial|Tech|Automotive/.test(style);
 return ensureContrast({primary,secondary:dark?'#232436':'#edeaf8',accent:luxury?'#c8a96e':'#9beba2',background:dark?'#101119':'#fbfaf7',foreground:dark?'#f4f3f8':'#191b26',muted:dark?'#b1b1c3':'#5b5b70',headingFont:luxury?'serif':angular?'mono':'sans',bodyFont:'sans',radius:angular?'small':luxury?'none':'large',density:style==='Minimal'?'spacious':'comfortable',shadow:luxury?'none':'soft',buttonStyle:luxury?'outline':'solid',cardStyle:angular?'bordered':'filled',scale:luxury||angular?'dramatic':'balanced'});
}
