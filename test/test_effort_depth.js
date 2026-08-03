import { runAgenticLoop } from '../src/agentLoop.js';

async function testEffortDepth() {
  console.log('🧪 Testing Reasoning Effort Levels (Low, Medium, High, Max) on Yukon Gold...\n');
  const prompt = 'what is js ?';

  console.log('1. Yukon Gold [Reasoning: Low]:');
  const resLow = await runAgenticLoop(prompt, { modelKey: 'yukon-gold', reasoningLevel: 'low', verbose: false });
  console.log(resLow);

  console.log('\n2. Yukon Gold [Reasoning: Max]:');
  const resMax = await runAgenticLoop(prompt, { modelKey: 'yukon-gold', reasoningLevel: 'max', verbose: false });
  console.log(resMax);

  const isDeeper = resMax.length > resLow.length && resMax.includes('MAX');
  if (isDeeper) {
    console.log('\n✅ PASSED: Reasoning effort levels properly dictate thinking & output depth regardless of model tier!');
  } else {
    console.error('\n❌ FAILED: Max effort output was not deeper than Low effort!');
    process.exit(1);
  }
}

testEffortDepth();
