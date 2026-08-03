import { startThinkingSpinner, stopThinkingSpinner } from '../src/spinner.js';
import { getModelProfile } from '../models/index.js';

async function testSpinner() {
  console.log('🧪 Testing Thinking Spinner Animation...\n');

  const profile = getModelProfile('sweet-potato');
  startThinkingSpinner(profile);

  await new Promise(r => setTimeout(r, 600));

  stopThinkingSpinner();
  console.log('✅ PASSED: Thinking spinner started and cleared cleanly!');
}

testSpinner();
