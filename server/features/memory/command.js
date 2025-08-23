const handleMemoryCommand = (command, payload) => {
  if (command === 'remember') {
    const eqSign = payload.indexOf('=');
    if (eqSign > 0) {
      const key = payload.slice(0, eqSign).trim();
      const value = payload.slice(eqSign + 1).trim();
      writeKV(USER_ID, key, value);
      return `Noted: ${key} = ${value}`;
    } else {
      writeEpisode(USER_ID, payload);
      return `Noted!`;
    }
  } else if (command === 'forget') {
    const key = payload.trim();
    deleteKV(USER_ID, key);
    return `Forgot ${key}`;
  } else if (command === 'list') {
    const items = listKV(USER_ID);
    return `Memory items: ${items.map(item => `${item.key}=${item.value}`).join(', ')}`;
  } else {
    return `Unknown command: ${command}`;
  }
};