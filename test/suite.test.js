import { listWorkspace, readFile, createFile, updateFile, deleteFile, fileExists } from '../src/tools/fileTools.js';
import { executeTerminalCommand } from '../src/tools/terminalTools.js';
import { searchDuckDuckGo, fetchWebPage, searchWikipedia } from '../src/tools/webTools.js';
import { queryKeylessLLM } from '../src/llmProvider.js';
import { runAgenticLoop } from '../src/agentLoop.js';

async function runTestSuite() {
  console.log('🧪 Starting PotatoAI Comprehensive Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  // 1. FILE TOOL TESTS
  console.log('🔹 1. Testing File CRUD Suite...');
  const testFile = 'unit_test_sample.js';
  const initialContent = 'console.log("Hello PotatoAI");';
  const updatedContent = 'console.log("Hello Agentic PotatoAI");';

  // Test createFile
  const createRes = createFile(testFile, initialContent);
  assert(fileExists(testFile), 'file_exists detects created file');

  // Test readFile
  const readRes = readFile(testFile);
  assert(readRes === initialContent, 'read_file returns exact written content');

  // Test updateFile (patching)
  const updateRes = updateFile(testFile, 'Hello PotatoAI', 'Hello Agentic PotatoAI');
  const readUpdated = readFile(testFile);
  assert(readUpdated === updatedContent, 'update_file correctly patches target string');

  // Test listWorkspace
  const listRes = listWorkspace('');
  assert(listRes.includes(testFile), 'list_workspace lists created test file');

  // Test deleteFile
  const delRes = deleteFile(testFile);
  assert(!fileExists(testFile), 'delete_file successfully removes file');

  // 2. TERMINAL EXECUTOR TESTS
  console.log('\n🔹 2. Testing Terminal Executor Suite...');
  const execRes = await executeTerminalCommand('node -v');
  assert(execRes.includes('STDOUT') || execRes.includes('v'), 'run_command executes node -v and captures stdout');

  // 3. WEB TOOLS TESTS
  console.log('\n🔹 3. Testing Web Tools Suite...');
  const wikiRes = await searchWikipedia('JavaScript');
  assert(wikiRes.includes('JavaScript'), 'searchWikipedia returns valid topic summary');

  const searchRes = await searchDuckDuckGo('Node.js');
  assert(typeof searchRes === 'string' && searchRes.length > 50, 'searchDuckDuckGo fetches search results');

  // 4. KEYLESS LLM PROVIDER TESTS
  console.log('\n🔹 4. Testing Keyless Zero-Auth LLM Provider...');
  const llmReply = await queryKeylessLLM([
    { role: 'user', content: 'Say hello in 3 words' }
  ]);
  assert(typeof llmReply === 'string' && llmReply.length > 0, 'queryKeylessLLM receives valid AI synthesis response without API keys');

  // 5. AUTONOMOUS REACT AGENTIC LOOP TESTS
  console.log('\n🔹 5. Testing Autonomous ReAct Agent Loop...');
  const agentPrompt = 'Create a file named agent_test.txt containing "PotatoAI Agent Active", then verify its existence.';
  const loopResult = await runAgenticLoop(agentPrompt, { maxSteps: 5, verbose: false });
  const agentFileExists = fileExists('agent_test.txt');
  assert(agentFileExists, 'runAgenticLoop autonomously creates target file');

  if (agentFileExists) {
    const agentFileContent = readFile('agent_test.txt');
    assert(agentFileContent.includes('PotatoAI Agent Active'), 'runAgenticLoop wrote correct content');
    deleteFile('agent_test.txt');
  }

  // SUMMARY RESULTS
  console.log('\n================================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
