import { runAgenticLoop } from '../src/agentLoop.js';

async function testSimpleAnswer() {
  console.log('⚡ Testing Yukon Gold Instant Jargon-Free Answer...');
  const start = Date.now();
  const answer = await runAgenticLoop('what is javascript ?', { modelKey: 'yukon-gold', verbose: true });
  const elapsed = Date.now() - start;

  console.log(`\n⏱️ Yukon Gold Execution Speed: ${elapsed}ms`);
  console.log('------------------------------------------------');
  console.log('Jargon-Free Output:\n', answer);
  console.log('------------------------------------------------');
}

testSimpleAnswer();
