import { MODELS, getModelProfile, formatModelMenu } from '../src/modelRegistry.js';
import { runAgenticLoop } from '../src/agentLoop.js';

async function testModelRegistry() {
  console.log('🧪 Testing PotatoAI Model Selection Suite...\n');
  let passed = 0;

  function assert(condition, msg) {
    if (condition) {
      console.log(`  ✅ PASSED: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${msg}`);
      process.exit(1);
    }
  }

  // 1. Verify Model Profiles
  const fingerling = getModelProfile('fingerling');
  assert(fingerling.name === 'Fingerling', 'Fingerling model profile retrieved');

  const sweetPotato = getModelProfile('sweet-potato');
  assert(sweetPotato.name === 'Sweet Potato', 'Sweet Potato model profile retrieved');

  const russet = getModelProfile('russet');
  assert(russet.name === 'Russet', 'Russet model profile retrieved');

  // 2. Verify Model Menu Formatting
  const menuText = formatModelMenu('sweet-potato');
  assert(menuText.includes('Fingerling') && menuText.includes('Sweet Potato') && menuText.includes('Russet'), 'Model menu formats all 3 tiers');

  // 3. Verify ReAct Agent Loop with Fingerling
  console.log('\n⚡ Testing Agentic Loop with Fingerling Model...');
  const resFingerling = await runAgenticLoop('list files', { modelKey: 'fingerling', verbose: false });
  assert(typeof resFingerling === 'string', 'Fingerling agent loop executes successfully');

  // 4. Verify ReAct Agent Loop with Sweet Potato
  console.log('🥔 Testing Agentic Loop with Sweet Potato Model...');
  const resSweet = await runAgenticLoop('list files', { modelKey: 'sweet-potato', verbose: false });
  assert(typeof resSweet === 'string', 'Sweet Potato agent loop executes successfully');

  // 5. Verify ReAct Agent Loop with Russet
  console.log('🏋️ Testing Agentic Loop with Russet Model...');
  const resRusset = await runAgenticLoop('list files', { modelKey: 'russet', verbose: false });
  assert(typeof resRusset === 'string', 'Russet agent loop executes successfully');

  console.log('\n================================================================');
  console.log(`📊 Model Test Summary: ${passed} Passed, 0 Failed`);
  console.log('================================================================\n');
}

testModelRegistry();
