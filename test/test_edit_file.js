import { createFile, readFile, deleteFile } from '../src/tools/fileTools.js';
import { runAgenticLoop } from '../src/agentLoop.js';

async function testEditingFile() {
  console.log('🧪 Testing File Editing Capabilities in PotatoAI...\n');

  // 1. Create an initial file
  const filename = 'Navbar.jsx';
  createFile(filename, `import React from 'react';

export default function Navbar() {
  return (
    <nav style={{ backgroundColor: '#333', color: '#fff' }}>
      <h1>PotatoAI</h1>
    </nav>
  );
}`);

  console.log('📄 Initial File Content:\n', readFile(filename));

  // 2. Ask PotatoAI to edit the file (e.g. add a contact link or update brand name)
  const editPrompt = `in Navbar.jsx replace "PotatoAI" with "PotatoAI Pro" and add a button "Sign In"`;
  console.log('\n🤖 User Prompt:', editPrompt);

  const result = await runAgenticLoop(editPrompt, { verbose: true, maxSteps: 5 });
  console.log('\nFINAL RESULT:\n', result);

  console.log('\n📄 Updated File Content:\n', readFile(filename));

  // Cleanup
  deleteFile(filename);
}

testEditingFile();
