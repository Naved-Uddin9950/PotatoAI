import { runAgenticLoop } from '../src/agentLoop.js';
import { readFile, fileExists, deleteFile } from '../src/tools/fileTools.js';

async function testReactNavbarPrompt() {
  const prompt = 'create a react component (navbar) with inline styling';
  console.log('Testing prompt:', prompt);

  const result = await runAgenticLoop(prompt, { verbose: true, maxSteps: 5 });
  console.log('\nFINAL AGENT RESULT:\n', result);

  if (fileExists('Navbar.jsx')) {
    console.log('\n📄 Navbar.jsx File Content:\n------------------------------------------------');
    console.log(readFile('Navbar.jsx'));
    console.log('------------------------------------------------\n');
    deleteFile('Navbar.jsx');
  } else {
    console.error('❌ Navbar.jsx was NOT created!');
  }
}

testReactNavbarPrompt();
