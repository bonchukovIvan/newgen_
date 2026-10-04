import detector from '@/vendor/avoid-ai-writing/detector/patterns.js';
import type {Section,SitePage} from '@/lib/validation/site';

// The upstream detector needs at least ten words. Scan a content group as one
// document so headings, CTAs, and short metadata fields still contribute.
const retryableMedium=new Set([
 'transition','filler','generic-conclusion','lets-construction',
 'confidence-calibration','hollow-intensifier','unnecessary-hyphenation',
]);
type DetectorIssue={type:string;text:string;severity:string};

export function writingIssue(copy:string):string|undefined {
 const result=detector.analyzeText(copy,{contextMode:'marketing',sourceMode:'plain'});
 if(result.document_classification==='UNSCORED')return;
 const issue=(result.issues as DetectorIssue[]).find(issue=>
  issue.severity==='critical'||issue.severity==='high'||
  (issue.severity==='medium'&&retryableMedium.has(issue.type)));
 return issue?`${(detector.TYPE_LABELS as Record<string,string>)[issue.type]||issue.type}: ${issue.text}`:undefined;
}

export function assertWritingQuality(entries:Iterable<string>,source:Iterable<string>=[]):void {
 const protectedCopy=new Set([...source].map(value=>value.trim()).filter(Boolean));
 const generated=[...entries].map(value=>value.trim()).filter(value=>value&&!protectedCopy.has(value));
 if(!generated.length)return;
 const issue=writingIssue(generated.join('\n\n'));
 if(issue)throw new Error(`Writing quality: ${issue.slice(0,120)}. Rewrite only the generated wording; keep supplied facts, policy qualifications, and structured fields unchanged.`);
}

export function sectionCopy(section:Section):string[] {
 return [section.eyebrow,section.title,section.body,section.cta,section.imageIntent,...section.items.flatMap(item=>[item.title,item.text])];
}

export function pageCopy(page:SitePage):string[] {
 return [page.title,page.objective,...Object.values(page.seo),...page.sections.flatMap(sectionCopy)];
}
