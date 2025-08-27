const Ok = (value) => ({ ok: true, value });
const Err = (code, message) => ({ ok: false, code, message });

const map = (result, fn) => result.ok ? Ok(fn(result.value)) : result;
const chain = (result, fn) => result.ok ? fn(result.value) : result;

/**
  * Wraps a synchronous function to return a Result type.
  * @example
  * // Original function that may throw
  * const getUserById = (id) => prepareStatement.get(id);
  * 
  * // return the below wrapped function
  * const safeGetUserById = tryCatchSync(getUserById);
  * 
  * // use the wrapped function:
  * const result = safeGetUserById(123); // { ok: true, value: { id: 123, name: 'Alice' } }
  * // OR
  * const errorResult = safeGetUserById(999); // { ok: false, code: 'INTERNAL_ERROR', message: 'User not found' }
  *
 */
const tryCatchSync = (fn) => (...args) => {
  try { return Ok(fn(...args)); }
  catch (e) { return Err('INTERNAL_ERROR', e.message); }
};

const tryCatchAsync = (fn) => async (...args) => {
  try { return Ok(await fn(...args)); }
  catch (e) { return Err('INTERNAL_ERROR', e.message); }
};

/**
 * Assumes the Result is Ok and returns the value, or throws an error if it's Err.
 * @param {Result} result 
 * @returns The value if result is Ok.
 * @throws Error if result is Err.
 * @example
 * const result = someFunctionThatReturnsResult();
 * const value = assumeOk(result); // throws if result is Err
 */
const assumeOk = (result) => {
  if (!result.ok) {
    throw new Error(`Expected Ok result but got Err: ${result.code} - ${result.message}`);
  }
  return result.value;
}

const assumeOKOrDefault = (result, fn) => 
  result.ok ? result.value : fn();

const unwrapErr = (result) => {
  if (result.ok) {
    throw new Error('Called unwrapErr on an Ok result');
  }
  return { code: result.code, message: result.message };
};


export { Ok, Err, map, chain, tryCatchSync, tryCatchAsync, assumeOk, unwrapErr };