import { runAgenticLoop } from '../src/agentLoop.js';

async function testKnowledgeQuery() {
  console.log('🧪 Testing Knowledge Query: "what is javascript ?"\n');
  const prompt = 'what is javascript ?';
  const result = await runAgenticLoop(prompt, { modelKey: 'yukon-gold', verbose: true });
  console.log('\nFINAL ANSWER:\n', result);
}

testKnowledgeQuery();
