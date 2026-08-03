import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultWorkspaceDir = path.resolve(__dirname, '../../workspace');

// Ensure workspace directory exists
if (!fs.existsSync(defaultWorkspaceDir)) {
  fs.mkdirSync(defaultWorkspaceDir, { recursive: true });
}

/**
 * Resolves a given path relative to the workspace directory.
 * Prevents directory traversal outside the root directory.
 */
export function resolveWorkspacePath(relativePath = '', baseDir = defaultWorkspaceDir) {
  const normalizedBase = path.resolve(baseDir);
  const targetPath = path.resolve(normalizedBase, relativePath);
  
  if (!targetPath.startsWith(normalizedBase)) {
    throw new Error(`Path security violation: Cannot access paths outside workspace (${relativePath})`);
  }
  return targetPath;
}

/**
 * Recursively lists files and directories in the workspace.
 */
export function listWorkspace(subDir = '', baseDir = defaultWorkspaceDir) {
  try {
    const targetDir = resolveWorkspacePath(subDir, baseDir);
    if (!fs.existsSync(targetDir)) {
      return `Directory "${subDir}" does not exist.`;
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    if (entries.length === 0) {
      return `Workspace folder "${subDir || './'}" is empty.`;
    }

    const items = [];
    for (const entry of entries) {
      const relItemPath = subDir ? path.join(subDir, entry.name) : entry.name;
      const fullPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        items.push(`📁 [DIR]  ${relItemPath}`);
      } else {
        const stats = fs.statSync(fullPath);
        items.push(`📄 [FILE] ${relItemPath} (${stats.size} bytes)`);
      }
    }

    return items.join('\n');
  } catch (err) {
    return `❌ Failed to list workspace directory: ${err.message}`;
  }
}

/**
 * Reads contents of a file in the workspace.
 */
export function readFile(relativePath, startLine = null, endLine = null, baseDir = defaultWorkspaceDir) {
  try {
    const filePath = resolveWorkspacePath(relativePath, baseDir);
    if (!fs.existsSync(filePath)) {
      return `❌ Error: File "${relativePath}" does not exist in workspace.`;
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      return `❌ Error: "${relativePath}" is a directory, not a file.`;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    if (startLine !== null || endLine !== null) {
      const lines = content.split(/\r?\n/);
      const start = startLine ? Math.max(1, parseInt(startLine, 10)) - 1 : 0;
      const end = endLine ? Math.min(lines.length, parseInt(endLine, 10)) : lines.length;
      const sliced = lines.slice(start, end).join('\n');
      return `Lines ${start + 1}-${end} of ${relativePath}:\n\`\`\`\n${sliced}\n\`\`\``;
    }

    return content;
  } catch (err) {
    return `❌ Failed to read file: ${err.message}`;
  }
}

/**
 * Creates or overwrites a file in the workspace.
 */
export function createFile(relativePath, content = '', baseDir = defaultWorkspaceDir) {
  try {
    const filePath = resolveWorkspacePath(relativePath, baseDir);
    const parentDir = path.dirname(filePath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return `✅ File "${relativePath}" created successfully (${Buffer.byteLength(content, 'utf-8')} bytes).`;
  } catch (err) {
    return `❌ Failed to create file "${relativePath}": ${err.message}`;
  }
}

/**
 * Updates/patches an existing file by replacing target content with new content.
 */
export function updateFile(relativePath, targetContent, replacementContent, baseDir = defaultWorkspaceDir) {
  try {
    const filePath = resolveWorkspacePath(relativePath, baseDir);
    if (!fs.existsSync(filePath)) {
      return `❌ Error: File "${relativePath}" does not exist. Use create_file to make a new file.`;
    }

    const existingContent = fs.readFileSync(filePath, 'utf-8');

    if (!targetContent && targetContent !== '') {
      // If target content is empty, append to end of file
      const updated = existingContent + '\n' + replacementContent;
      fs.writeFileSync(filePath, updated, 'utf-8');
      return `✅ Appended content to "${relativePath}".`;
    }

    if (!existingContent.includes(targetContent)) {
      return `❌ Error: Target content string not found in "${relativePath}". File was not modified.`;
    }

    const updatedContent = existingContent.replace(targetContent, replacementContent);
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    return `✅ Successfully updated/patched file "${relativePath}".`;
  } catch (err) {
    return `❌ Failed to update file "${relativePath}": ${err.message}`;
  }
}

/**
 * Deletes a file or directory in the workspace.
 */
export function deleteFile(relativePath, baseDir = defaultWorkspaceDir) {
  try {
    const filePath = resolveWorkspacePath(relativePath, baseDir);
    if (!fs.existsSync(filePath)) {
      return `⚠️ Warning: Path "${relativePath}" does not exist.`;
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
      return `✅ Directory "${relativePath}" deleted successfully.`;
    } else {
      fs.unlinkSync(filePath);
      return `✅ File "${relativePath}" deleted successfully.`;
    }
  } catch (err) {
    return `❌ Failed to delete path "${relativePath}": ${err.message}`;
  }
}

/**
 * Checks if file or directory exists.
 */
export function fileExists(relativePath, baseDir = defaultWorkspaceDir) {
  try {
    const filePath = resolveWorkspacePath(relativePath, baseDir);
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}
