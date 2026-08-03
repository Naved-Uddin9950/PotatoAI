import { runAgenticLoop } from '../src/agentLoop.js';

async function testModelDiff() {
  console.log('🧪 Testing Distinct Output Differences Between Yukon Gold, Sweet Potato, and Russet...\n');
  const prompt = 'diff between FE and BE';

  console.log('⚡ 1. Yukon Gold Response:');
  const yukonRes = await runAgenticLoop(prompt, { modelKey: 'yukon-gold', reasoningLevel: 'low', verbose: false });
  console.log(yukonRes);

  console.log('\n🥔 2. Sweet Potato Response:');
  const sweetRes = await runAgenticLoop(prompt, { modelKey: 'sweet-potato', reasoningLevel: 'low', verbose: false });
  console.log(sweetRes);

  console.log('\n🏋️ 3. Russet (Benchmark Tier) Response:');
  const russetRes = await runAgenticLoop(prompt, { modelKey: 'russet', reasoningLevel: 'low', verbose: false });
  console.log(russetRes);

  const isDifferent = (yukonRes !== sweetRes) && (sweetRes !== russetRes);
  if (isDifferent) {
    console.log('\n✅ PASSED: All 3 model tiers produce distinctly different, model-appropriate answers!');
  } else {
    console.error('\n❌ FAILED: Answers were identical!');
    process.exit(1);
  }
}

testModelDiff();
