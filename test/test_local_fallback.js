import { queryKeylessLLM } from '../src/llmProvider.js';
import { runAgenticLoop } from '../src/agentLoop.js';

async function testPrompt() {
  const prompt = 'create a js file with logging hello world';
  console.log('Testing prompt:', prompt);
  const result = await runAgenticLoop(prompt, { verbose: true, maxSteps: 5 });
  console.log('\nFINAL RESULT:\n', result);
}

testPrompt();
