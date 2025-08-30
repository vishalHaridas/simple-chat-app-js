import { Ok, Err, assumeOk } from '../../utils/result.js';
/**
 * Creates a memory facade for managing user memory.
 * @param {Object} kvService 
 * @param {Object} episodicService 
 * @returns {Object} memoryFacade
 * @example
 * const memoryFacade = createMemoryFacade(kvService, episodeService);
 * const result = memoryFacade.parseCommand('remember key=value');
 * if (!result.isOk()) {
 *  console.error(result.error);
 * } else {
 * const { command, payload } = result.value;
 * const execResult = memoryFacade.executeCommand(USER_ID, command, payload);
 * if (!execResult.isOk()) {
 *   console.error(execResult.error);
 * } else {
 *   console.log(execResult.value.message);
 */
export const createMemoryFacade = (kvService, episodicService) => {
  /**
   * Parses a slash command input into command and payload.
   * @param {string} input
   * @returns {Result} Result object with { command, payload } or error.
   * @example
   * const result = parseSlashCommand('/remember key=value');
   * if (!result.isOk()) {
   *  console.error(result.error);
   * } else {
   * const { command, payload } = result.value;
   */
  const parseSlashCommand = (input) => {
    if (!input.startsWith('/')) {
      return Err('invalid_command', 'Command must start with a slash (/)');
    }
    const parts = input.split(' ');
    const command = parts[0];
    const payload = parts.slice(1).join(' ');
    return Ok({ command, payload });
  }

  /**
   * Determines if the memory command is for key-value or episodic memory.
   * @param {string} command 
   * @param {string} payload 
   * @returns {Result} Result object with 'kv' or 'episodic'
   * @example
   * const result = kvOrEpisodic('remember', 'key=value');
   * if (!result.isOk()) {
   *  console.error(result.error);
   * } else {
   * const type = result.value; // 'kv'
   */
  const kvOrEpisodic = (command, payload) => {
    if (command !== '/remember') {
      return Err('invalid_command', `Only command containing 'remember' is detected`);
    }
    return Ok(payload.includes('=') ? 'kv' : 'episodic');
  }

  /**
   * Parses a key-value payload in the format "key=value".
   * @param {string} payload 
   * @returns {Result} Result object with { key, value } or error.
   * @example
   * const result = parseKVPayload('color=blue');
   * if (!result.isOk()) {
   *  console.error(result.error);
   * } else {
   * const { key, value } = result.value;
   */
  const parseKVPayload = (payload) => {
    const eqSign = payload.indexOf('=');
    if (eqSign > 0) {
      const key = payload.slice(0, eqSign).trim();
      const value = payload.slice(eqSign + 1).trim();
      return Ok({ key, value });
    }
    return Err('invalid_format', 'Invalid format for key-value pair. Use key=value.');
  }

  /**
   * @typedef {Object} Result<T>
   * @property {boolean} ok - Indicates if the operation was successful.
   * @property {T} [value] - The value returned by the operation, if successful.
   * @property {string} [error] - The error code, if the operation failed.
   * @property {string} [message] - The error message, if the operation failed.
   */

  /**
   * Executes a memory command for a user.
   * @param {string} userId 
   * @param {string} command 
   * @param {string} payload 
   * @returns {Result}
   * 
   * @example
   * const result = memoryFacade.executeCommand(USER_ID, 'remember', 'key=value');
   * if (!result.isOk()) {
   *   console.error(result.error);
   * } else {
   *   console.log(result.value.message);
   * }
   */
  const executeCommand = (userId, command, payload) => {
    switch (command) {
      case '/remember':
        const memoryType = assumeOk(kvOrEpisodic(command, payload));
        console.log(`memoryType: ${JSON.stringify(memoryType)}`);
        if (memoryType === 'kv') {
          const kvResult = parseKVPayload(payload);
          if (!kvResult.ok) 
            return kvResult; // which is an Err
          const { key, value } = kvResult.value;
          kvService.writeKV(userId, key, value);
          return Ok({ message: `Noted: ${key} = ${value}` });
        } else if (memoryType === 'episodic') {
          episodicService.writeEpisode(userId, payload);
          return Ok({ message: 'Noted!' });
        }
        break;
      case '/forget':
        const key = payload.trim();
        kvService.deleteKV(userId, key);
        return Ok({ message: `Forgot ${key}` });
      case '/list':
        const itemsResult = kvService.listKV(userId);
        if (!itemsResult.ok) {
          return Err('kv_list_error', 'Failed to list key-value memory');
        }
        return Ok({ message: `Memory items: ${itemsResult.value.map(item => `${item.key}=${item.value}`).join(', ')}` });
      default:
        return Err('unknown_command', `Unknown command: ${command}`);
    }
  }

  const listKV = (userId) => {
    const kvListResult = kvService.listKV(userId);
    if (!kvListResult.ok) {
      return Err('kv_list_error', 'Failed to list key-value memory');
    };

    return Ok(kvListResult.value);
  }

  const recentEpisodes = (userId, limit = 5) => {
    const epiListResult = episodicService.recentEpisodes(userId, limit);
    if (!epiListResult.ok) {
      return Err('episodic_list_error', 'Failed to list episodic memory');
    };

    return Ok(epiListResult.value);
  }

  return {
    parseSlashCommand,
    executeCommand,

    listKV,
    recentEpisodes
  };
}
