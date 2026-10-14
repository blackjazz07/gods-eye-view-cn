import { createActionTools } from '../../../src/voice/actionSchemas.js';
import { ACTION_DESCRIPTIONS } from './toolDescriptions.js';

export const GEV_REALTIME_TOOLS = createActionTools(ACTION_DESCRIPTIONS);

/**
 * The session's tools: the app actions, then additional function tools
 * whose names no action already uses.
 */
export function realtimeSessionTools(additional = []) {
  const names = new Set(GEV_REALTIME_TOOLS.map((tool) => tool.name));
  return [
    ...GEV_REALTIME_TOOLS,
    ...additional.filter((tool) => !names.has(tool.name)),
  ];
}

/**
 * Convert the flat `{ type: 'function', name, description, parameters }`
 * records into the nested `{ type: 'function', function: { name, description,
 * parameters } }` shape that Aliyun Bailian's realtime `session.update`
 * accepts (the Chat Completions function-calling layout, not OpenAI Realtime's
 * flattened form).
 */
export function toBailianTools(tools = GEV_REALTIME_TOOLS) {
  return tools.map(({ name, description, parameters }) => ({
    type: 'function',
    function: { name, description, parameters },
  }));
}
