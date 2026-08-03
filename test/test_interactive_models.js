import { yukonGoldModel } from '../models/yukon-gold/model.js';
import { sweetPotatoModel } from '../models/sweet-potato/model.js';
import { russetModel } from '../models/russet/model.js';
import { getModelProfile, MODELS } from '../models/index.js';

function runModelFolderTest() {
  console.log('🧪 Testing PotatoAI Modular Model Directory Suite...\n');
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

  // 1. Verify Modular File Structure & Exports
  assert(yukonGoldModel.id === 'yukon-gold' && yukonGoldModel.name === 'Yukon Gold', 'models/yukon-gold/model.js loads Yukon Gold profile');
  assert(sweetPotatoModel.id === 'sweet-potato' && sweetPotatoModel.name === 'Sweet Potato', 'models/sweet-potato/model.js loads Sweet Potato profile');
  assert(russetModel.id === 'russet' && russetModel.name === 'Russet', 'models/russet/model.js loads Russet profile');

  // 2. Verify Index Lookup & Fallbacks
  const yukonProfile = getModelProfile('yukon-gold');
  assert(yukonProfile.name === 'Yukon Gold', 'getModelProfile retrieves Yukon Gold');

  const sweetProfile = getModelProfile('sweet-potato');
  assert(sweetProfile.name === 'Sweet Potato', 'getModelProfile retrieves Sweet Potato');

  const russetProfile = getModelProfile('russet');
  assert(russetProfile.name === 'Russet', 'getModelProfile retrieves Russet');

  console.log('\n================================================================');
  console.log(`📊 Modular Models Test Summary: ${passed} Passed, 0 Failed`);
  console.log('================================================================\n');
}

runModelFolderTest();
