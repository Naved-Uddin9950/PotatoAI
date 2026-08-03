import { REASONING_MODES, getReasoningProfile, formatReasoningMenu } from '../src/reasoning.js';
import { runAgenticLoop } from '../src/agentLoop.js';

async function testReasoningModes() {
  console.log('🧪 Testing PotatoAI Reasoning Mode System (Low, Medium, High, Max)...\n');
  let passed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ PASSED: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${msg}`);
      process.exit(1);
    }
  }

  // 1. Verify Profiles
  assert(getReasoningProfile('Low').name === 'Low', 'Low reasoning profile retrieved');
  assert(getReasoningProfile('Medium').name === 'Medium', 'Medium reasoning profile retrieved');
  assert(getReasoningProfile('High').name === 'High', 'High reasoning profile retrieved');
  assert(getReasoningProfile('Max').name === 'Max', 'Max reasoning profile retrieved');

  // 2. Verify Menu Formatting
  const menuText = formatReasoningMenu('high');
  assert(menuText.includes('Low') && menuText.includes('Medium') && menuText.includes('High') && menuText.includes('Max'), 'Reasoning menu formats all 4 levels');

  // 3. Verify Agent Loop under High Reasoning
  console.log('\n🔬 Testing Agentic Loop under High Reasoning Mode...');
  const resHigh = await runAgenticLoop('create a js file named test_r.js logging high reasoning', {
    modelKey: 'sweet-potato',
    reasoningLevel: 'High',
    verbose: false
  });
  assert(typeof resHigh === 'string', 'High reasoning loop executes successfully');

  console.log('\n================================================================');
  console.log(`📊 Reasoning Modes Test Summary: ${passed} Passed, 0 Failed`);
  console.log('================================================================\n');
}

testReasoningModes();
