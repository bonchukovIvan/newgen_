import {z} from 'zod';
export function validateEnv() {
 const result=z.object({DATABASE_URL:z.string().startsWith('postgresql://'),BETTER_AUTH_SECRET:z.string().min(32),BETTER_AUTH_URL:z.url(),MOCK_AI:z.enum(['true','false']).default('true')}).parse(process.env);
 if(result.MOCK_AI==='false'&&(!process.env.OPENAI_API_KEY||!process.env.OPENAI_TEXT_MODEL))throw new Error('Live mode requires OPENAI_API_KEY and OPENAI_TEXT_MODEL');
 if(process.env.NODE_ENV==='production'&&result.BETTER_AUTH_SECRET==='replace-with-at-least-32-random-characters')throw new Error('Set a unique BETTER_AUTH_SECRET before production deployment');
 return result;
}
export const isMock=()=>process.env.MOCK_AI!=='false';
