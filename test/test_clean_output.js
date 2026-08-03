import { runAgenticLoop } from '../src/agentLoop.js';

async function testCleanOutput() {
  console.log('🧪 Testing Clean Output (verbose: false)...\n');
  const answer = await runAgenticLoop('diff between FE and BE', {
    modelKey: 'yukon-gold',
    reasoningLevel: 'low',
    verbose: false
  });

  console.log('Clean Output Received:\n', answer);

  const containsStepLogs = answer.includes('[Step 1') || answer.includes('Reason (Low)') || answer.includes('finish(');
  if (!containsStepLogs) {
    console.log('\n✅ PASSED: Output is 100% clean without step logs or JSON tool calls!');
  } else {
    console.error('\n❌ FAILED: Output contains step logs!');
    process.exit(1);
  }
}

testCleanOutput();
