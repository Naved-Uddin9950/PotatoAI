import { AGENT_SYSTEM_PROMPT } from '../src/promptTemplates.js';

async function testPollinationsGet() {
  const prompt = 'create a js file with logging hello world';
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&system=${encodeURIComponent(AGENT_SYSTEM_PROMPT)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    console.log('Pollinations GET status:', res.status);
    const text = await res.text();
    console.log('Pollinations GET Response:\n', text);
  } catch (err) {
    console.error('Pollinations GET error:', err.message);
  }
}

testPollinationsGet();
