import { exec } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultWorkspaceDir = path.resolve(__dirname, '../../workspace');

/**
 * Executes a shell command locally in the workspace directory.
 * Includes timeout protection and structured output formatting.
 */
export function executeTerminalCommand(cmd, cwd = defaultWorkspaceDir, timeoutMs = 30000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    exec(cmd, { cwd, timeout: timeoutMs, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      let resultStr = `⏱️ Execution time: ${elapsed}s\n`;

      if (stdout && stdout.trim()) {
        const cleanStdout = stdout.trim();
        const truncated = cleanStdout.length > 4000 ? cleanStdout.slice(0, 4000) + '\n... (output truncated)' : cleanStdout;
        resultStr += `⚡ STDOUT:\n\`\`\`\n${truncated}\n\`\`\`\n`;
      }

      if (stderr && stderr.trim()) {
        const cleanStderr = stderr.trim();
        const truncatedErr = cleanStderr.length > 2000 ? cleanStderr.slice(0, 2000) + '\n... (stderr truncated)' : cleanStderr;
        resultStr += `⚠️ STDERR:\n\`\`\`\n${truncatedErr}\n\`\`\`\n`;
      }

      if (error) {
        if (error.killed || error.signal === 'SIGTERM') {
          resultStr += `❌ ERROR: Command timed out after ${timeoutMs / 1000} seconds.\n`;
        } else {
          resultStr += `❌ ERROR (Exit Code ${error.code || 1}): ${error.message.trim()}\n`;
        }
      }

      if (!stdout && !stderr && !error) {
        resultStr += `⚡ Command completed successfully with exit code 0 (no output streams).`;
      }

      resolve(resultStr.trim());
    });
  });
}
