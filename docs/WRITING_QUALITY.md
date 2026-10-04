# Generated writing quality

The project vendors [`conorbronsdon/avoid-ai-writing`](https://github.com/conorbronsdon/avoid-ai-writing) at commit `42e4f76e92af3ac41d17cee545046d8d399c59a6` in `vendor/avoid-ai-writing/`. Its MIT license is included there.

`lib/ai/writing-quality.ts` imports the repository's `detector/patterns.js` directly. New business identities, sitemap wording, page copy, section rewrites, required pages, and SEO pass through it during generation. The model receives detector feedback and may retry up to two times. Reader supplied fields that are copied unchanged are excluded from the scan.

The detector scores English prose only and declines to score groups shorter than ten words. The integration scans each generated content group together to cover short headings and CTAs, but a very short group can still be unscored. The repository's `SKILL.md` is an editorial workflow for an interactive agent; it is not a callable rewrite function. The application uses the detector as a utility and keeps its existing structured output and factual checks.

To update the vendored copy, clone a new upstream revision, replace `vendor/avoid-ai-writing/`, remove its nested `.git`, update the commit here, and run the project tests. Review changes to `detector/patterns.js` before upgrading because its issue types and severity levels are used by the generation retry check.
