import { runAgenticLoop } from '../src/agentLoop.js';

async function testModelSpeed() {
  console.log('⚡ Testing Yukon Gold (Fast Mode) Speed...');
  const startYukon = Date.now();
  const resYukon = await runAgenticLoop('create a js file with logging hello world', { modelKey: 'yukon-gold', verbose: false });
  const elapsedYukon = Date.now() - startYukon;
  console.log(`⏱️ Yukon Gold Execution Time: ${elapsedYukon}ms`);
  console.log('Result:', resYukon);

  console.log('\n🏋️ Testing Russet (Benchmark Highest Reasoning Mode)...');
  const startRusset = Date.now();
  const resRusset = await runAgenticLoop('create a js file with logging hello world', { modelKey: 'russet', verbose: false });
  const elapsedRusset = Date.now() - startRusset;
  console.log(`⏱️ Russet Execution Time: ${elapsedRusset}ms`);
  console.log('Result:', resRusset);
}

testModelSpeed();
