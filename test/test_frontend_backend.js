import { runAgenticLoop } from '../src/agentLoop.js';

async function testFrontendBackendQuery() {
  console.log('🧪 Testing Query: "can you elobarate about backend and frontend ?"\n');
  const prompt = 'can you elobarate about backend and frontend ?';

  const start = Date.now();
  const answer = await runAgenticLoop(prompt, { modelKey: 'yukon-gold', verbose: true });
  const elapsed = Date.now() - start;

  console.log(`\n⏱️ Execution Time: ${elapsed}ms`);
  console.log('------------------------------------------------');
  console.log('Response:\n', answer);
  console.log('------------------------------------------------');
}

testFrontendBackendQuery();
