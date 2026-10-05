import type { Theme } from '@/lib/validation/site';
export const presets = ['Modern Corporate','Premium Luxury','Minimal','Startup','Professional Services','Tech','Gaming','Industrial','Medical','Beauty','Restaurant','Creative Agency','Financial','Real Estate','Automotive','Local Service Business'];
function luminance(hex:string) { const c=hex.slice(1).match(/.{2}/g)!.map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4); return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722; }
export function contrast(a:string,b:string) {const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function readable(bg:string) {return contrast(bg,'#ffffff')>=4.5?'#ffffff':'#101118';}
export function ensureContrast(t:Theme):Theme { return {...t,foreground:contrast(t.background,t.foreground)>=4.5?t.foreground:readable(t.background),muted:contrast(t.background,t.muted)>=4.5?t.muted:readable(t.background)}; }
const fontPairs:Pick<Theme,'headingFont'|'bodyFont'>[]=[
 {headingFont:'sans',bodyFont:'sans'},
 {headingFont:'serif',bodyFont:'sans'},
 {headingFont:'serif',bodyFont:'humanist'},
 {headingFont:'mono',bodyFont:'sans'},
 {headingFont:'humanist',bodyFont:'serif'},
 {headingFont:'display',bodyFont:'sans'},
 {headingFont:'display',bodyFont:'humanist'},
];
export function randomFontPair():Pick<Theme,'headingFont'|'bodyFont'> {return fontPairs[Math.floor(Math.random()*fontPairs.length)];}
export const designDirections=[
 {navigation:'inline',footer:'minimal',radius:'small',density:'compact',shadow:'none',buttonStyle:'solid',cardStyle:'plain',scale:'balanced',fonts:0},
 {navigation:'centered',footer:'editorial',radius:'none',density:'spacious',shadow:'none',buttonStyle:'outline',cardStyle:'plain',scale:'dramatic',fonts:1},
 {navigation:'split',footer:'columns',radius:'medium',density:'comfortable',shadow:'soft',buttonStyle:'solid',cardStyle:'bordered',scale:'balanced',fonts:2},
 {navigation:'stacked',footer:'split',radius:'large',density:'spacious',shadow:'soft',buttonStyle:'pill',cardStyle:'filled',scale:'dramatic',fonts:4},
 {navigation:'inline',footer:'centered',radius:'small',density:'comfortable',shadow:'bold',buttonStyle:'outline',cardStyle:'bordered',scale:'dramatic',fonts:3},
] as const;
export function designDirection(style:string,seed=0){
 const styleOffset=[...style].reduce((sum,char)=>sum+char.charCodeAt(0),0);
 return designDirections[((seed+styleOffset)%designDirections.length+designDirections.length)%designDirections.length];
}
function mix(a:string,b:string,weight:number) {
 const channels=(hex:string)=>hex.match(/[0-9a-f]{2}/gi)!.map(value=>parseInt(value,16));
 const first=channels(a),second=channels(b);
 return '#'+first.map((value,index)=>Math.round(value*(1-weight)+second[index]*weight).toString(16).padStart(2,'0')).join('');
}
function companion(primary:string,luxury:boolean) {
 const [red,green,blue]=primary.match(/[0-9a-f]{2}/gi)!.map(value=>parseInt(value,16)/255);
 const high=Math.max(red,green,blue),low=Math.min(red,green,blue),range=high-low;
 let hue=0;
 if(range)hue=high===red?((green-blue)/range)%6:high===green?(blue-red)/range+2:(red-green)/range+4;
 hue=(hue*60+360+(luxury?35:125))%360;
 const saturation=luxury?.45:.58,lightness=luxury?.59:.55;
 const chroma=(1-Math.abs(2*lightness-1))*saturation;
 const segment=hue/60,secondary=chroma*(1-Math.abs(segment%2-1)),offset=lightness-chroma/2;
 const rgb=segment<1?[chroma,secondary,0]:segment<2?[secondary,chroma,0]:segment<3?[0,chroma,secondary]:segment<4?[0,secondary,chroma]:segment<5?[secondary,0,chroma]:[chroma,0,secondary];
 return '#'+rgb.map(channel=>Math.round((channel+offset)*255).toString(16).padStart(2,'0')).join('');
}
export function createTheme(style:string,dark:boolean,primary:string,seed=0):Theme {
 const luxury=/Luxury|Beauty|Restaurant|Real Estate/.test(style), angular=/Gaming|Industrial|Tech|Automotive/.test(style);
 const direction=designDirection(style,seed);
 const background=mix(dark?'#101119':'#fbfaf7',primary,dark?.2:.12);
 return ensureContrast({primary,secondary:mix(background,primary,dark?.26:.18),accent:companion(primary,luxury),background,foreground:dark?'#f4f3f8':'#191b26',muted:dark?'#b1b1c3':'#5b5b70',...fontPairs[direction.fonts],radius:angular&&direction.radius==='large'?'small':direction.radius,density:style==='Minimal'?'spacious':direction.density,shadow:luxury?'none':direction.shadow,buttonStyle:luxury?'outline':direction.buttonStyle,cardStyle:angular?'bordered':direction.cardStyle,scale:luxury||angular?'dramatic':direction.scale});
}
