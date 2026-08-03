import { AGENT_SYSTEM_PROMPT } from './promptTemplates.js';
import { queryKeylessLLM } from './llmProvider.js';
import { getModelProfile } from '../models/index.js';
import { getReasoningProfile } from './reasoning.js';
import { listWorkspace, readFile, createFile, updateFile, deleteFile } from './tools/fileTools.js';
import { executeTerminalCommand } from './tools/terminalTools.js';
import { searchDuckDuckGo, fetchWebPage, searchWikipedia } from './tools/webTools.js';

/**
 * Extracts and parses JSON tool calls from LLM response text.
 */
function parseToolCall(responseStr) {
  if (!responseStr) return null;

  let raw = responseStr.trim();

  // Strip leading/trailing markdown code fences only if response explicitly starts with ```json
  if (raw.startsWith('```json') || raw.startsWith('```JSON')) {
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw.trim()) : raw;
    if (parsed && typeof parsed === 'object' && (parsed.tool || parsed.action)) {
      return {
        thought: parsed.thought || parsed.reasoning || '',
        tool: parsed.tool || parsed.action,
        args: parsed.args || parsed.parameters || {}
      };
    }
  } catch (e) {}

  return null;
}

/**
 * Executes a tool by name with arguments.
 */
async function executeTool(toolName, args = {}) {
  switch (toolName) {
    case 'list_workspace':
      return listWorkspace(args.subDir || '');

    case 'read_file':
      return readFile(args.filePath, args.startLine, args.endLine);

    case 'create_file':
      return createFile(args.filePath, args.content || '');

    case 'update_file':
      return updateFile(args.filePath, args.targetContent || '', args.replacementContent || '');

    case 'delete_file':
      return deleteFile(args.filePath);

    case 'run_command':
      return await executeTerminalCommand(args.command || '');

    case 'web_search':
      return await searchDuckDuckGo(args.query || '');

    case 'web_fetch':
      return await fetchWebPage(args.url || '');

    case 'wiki_summary':
      return await searchWikipedia(args.topic || '');

    case 'finish':
      return args.answer || 'Task completed successfully.';

    default:
      return `❌ Error: Tool "${toolName}" is not recognized. Please use one of the valid tools.`;
  }
}

/**
 * Runs the autonomous ReAct (Reasoning + Action) execution loop for a user request.
 */
export async function runAgenticLoop(userPrompt, options = {}) {
  const modelKey = options.modelKey || 'sweet-potato';
  const modelProfile = getModelProfile(modelKey);
  const reasoningLevel = options.reasoningLevel || (modelKey === 'russet' ? 'high' : 'medium');
  const reasoningProfile = getReasoningProfile(reasoningLevel);

  const maxSteps = options.maxSteps || Math.max(modelProfile.maxSteps, reasoningProfile.maxSteps);
  const verbose = options.verbose !== false;

  const systemPromptWithReasoning = `${AGENT_SYSTEM_PROMPT}\n\nREASONING MODE DIRECTIVE [Level: ${reasoningProfile.name}]:\n${reasoningProfile.directive}`;

  const messages = [
    { role: 'system', content: systemPromptWithReasoning },
    { role: 'user', content: userPrompt }
  ];

  if (verbose) {
    console.log(`\n${modelProfile.icon} PotatoAI [Model: ${modelProfile.name} | Reasoning: ${reasoningProfile.name}] starting for task: "${userPrompt}"`);
    console.log(`--------------------------------------------------------------------------------`);
  }

  for (let step = 1; step <= maxSteps; step++) {
    if (verbose) console.log(`\n🔄 [Step ${step}/${maxSteps}] Reason (${reasoningProfile.name}) & Planning...`);

    // Call keyless LLM with selected model profile & reasoning effort
    const llmOutput = await queryKeylessLLM(messages, modelKey, reasoningLevel);
    if (!llmOutput) {
      return `❌ Agentic Loop Error: Received empty response from keyless LLM provider.`;
    }

    // Append LLM response to context
    messages.push({ role: 'assistant', content: llmOutput });

    // Parse tool call JSON
    const toolCall = parseToolCall(llmOutput);

    if (!toolCall) {
      if (verbose) console.log(`💬 Agent Response:\n${llmOutput}`);
      return llmOutput;
    }

    const { thought, tool, args } = toolCall;

    if (verbose) {
      if (thought) console.log(`🧠 Thought [Reasoning: ${reasoningProfile.name}]: ${thought}`);
      console.log(`🔧 Action: ${tool}(${JSON.stringify(args || {})})`);
    }

    // Check for finish tool
    if (tool === 'finish') {
      const finalAnswer = args?.answer || thought || 'Task completed.';
      if (verbose) {
        console.log(`\n🎉 Task Finished!`);
        console.log(`--------------------------------------------------------------------------------`);
      }
      return finalAnswer;
    }

    // Execute tool action
    const observation = await executeTool(tool, args);

    if (verbose) {
      const preview = typeof observation === 'string' && observation.length > 500 
        ? observation.slice(0, 500) + '\n... (truncated)' 
        : observation;
      console.log(`👁️ Observation:\n${preview}`);
    }

    // Append observation feedback to messages
    messages.push({
      role: 'user',
      content: `OBSERVATION from tool "${tool}":\n${observation}\n\nProvide the next step or issue "finish" tool if task is complete.`
    });
  }

  return `⚠️ Agentic Loop reached maximum step limit (${maxSteps} steps for ${modelProfile.name} under Reasoning ${reasoningProfile.name}). Task stopped.`;
}
