import {defineConfig} from 'vitest/config';
import path from 'node:path';
import {existsSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
export default defineConfig({resolve:{alias:{'@':path.resolve('.')}},test:{environment:'node',include:process.env.RUN_INTEGRATION==='true'?['tests/**/*.integration.test.ts']:['tests/**/*.test.ts','tests/**/*.test.tsx'],exclude:process.env.RUN_INTEGRATION==='true'?[]:['tests/**/*.integration.test.ts'],testTimeout:120000,fileParallelism:false}});
