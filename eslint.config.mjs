import {defineConfig, globalIgnores} from 'eslint/config';
import next from 'eslint-config-next/core-web-vitals';
import ts from 'eslint-config-next/typescript';
export default defineConfig([...next,...ts,{rules:{'react-hooks/set-state-in-effect':'off','react-hooks/immutability':'off','@next/next/no-img-element':'off','@next/next/no-html-link-for-pages':'off','@next/next/no-location-assign-relative-destination':'off','@next/next/no-css-tags':'off','react-hooks/incompatible-library':'off'}},globalIgnores(['.next/**','node_modules/**','generated-sites/**','test-results/**','playwright-report/**'])]);
