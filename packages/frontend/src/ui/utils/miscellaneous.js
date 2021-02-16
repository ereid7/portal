/**
 * Does nothing.
 */
export function noop() {}

/**
 * A function that only returns the first parameter passed to it.
 * @param {any} x The first parameter
 * @returns {any}
 */
export function identity(x) {
  return x;
}

/**
 * Creates a new object from obj that only contains specific keys.
 * @param {object} obj The source object.
 * @param {array}  keys The keys to pick in the source object.
 * @returns {object}
 */
export function pick(obj, keys) {
  return keys.reduce((filtered, key) => {
    if (obj[key] !== undefined) {
      filtered[key] = obj[key];
    }
    return filtered;
  }, {});
}
