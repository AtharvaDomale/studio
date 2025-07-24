
'use server';
import { createMcpClient } from '@genkit-ai/mcp';

// This client connects to your n8n workflow exposed via MCP.
// The tools from this workflow will be dynamically available to agents that use this client.
export const n8nClient = createMcpClient({
  name: 'n8n', // A unique namespace for the tools from this client.
  mcpServer: {
    url: 'https://n8n-aptask-com-u23220.vm.elestio.app/mcp/gmail-enhanced/sse',
  },
});
