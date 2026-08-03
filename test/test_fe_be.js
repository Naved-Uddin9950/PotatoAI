import { runAgenticLoop } from '../src/agentLoop.js';

async function testAbbreviationQuery() {
  console.log('🧪 Testing Abbreviation Query: "diff between FE and BE"\n');
  const prompt = 'diff between FE and BE';

  const start = Date.now();
  const answer = await runAgenticLoop(prompt, { modelKey: 'yukon-gold', verbose: true });
  const elapsed = Date.now() - start;

  console.log(`\n⏱️ Execution Time: ${elapsed}ms`);
  console.log('------------------------------------------------');
  console.log('Clean Response:\n', answer);
  console.log('------------------------------------------------');
}

testAbbreviationQuery();
