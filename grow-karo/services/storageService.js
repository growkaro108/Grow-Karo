/**
 * Unified CRUD Service for Web Storage (localStorage & sessionStorage)
 */
class StorageService {
  /**
   * Selects the target storage engine.
   * @param {"local" | "session"} type
   * @returns {Storage}
   */
  #getStorage(type = "local") {
    return type === "session" ? window.sessionStorage : window.localStorage;
  }

  /**
   * CREATE / SET: Store an item in storage.
   * @param {string} key - The key name.
   * @param {any} value - Data to store (objects/arrays will be JSON stringified automatically).
   * @param {"local" | "session"} [storageType="local"]
   * @returns {boolean} Returns true if successful, false if failed.
   */
  set(key, value, storageType = "local") {
    try {
      const storage = this.#getStorage(storageType);
      const serializedValue = JSON.stringify(value);
      storage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      if (error.name === "QuotaExceededError" || error.code === 22) {
        console.error(
          `[Storage Error]: Quota exceeded on ${storageType}Storage.`,
        );
      } else {
        console.error(`[Storage Error]: Failed to save key "${key}"`, error);
      }
      return false;
    }
  }

  /**
   * READ / GET: Retrieve an item from storage.
   * @param {string} key - The key name.
   * @param {any} [defaultValue=null] - Value to return if key doesn't exist.
   * @param {"local" | "session"} [storageType="local"]
   * @returns {any}
   */
  get(key, defaultValue = null, storageType = "local") {
    try {
      const storage = this.#getStorage(storageType);
      const item = storage.getItem(key);

      if (item === null) return defaultValue;

      return JSON.parse(item);
    } catch (error) {
      console.error(`[Storage Error]: Error parsing key "${key}"`, error);
      return defaultValue;
    }
  }

  /**
   * UPDATE: Update an existing stored object or array by merging values.
   * @param {string} key - The key name.
   * @param {object | Function} updateValue - Object properties to merge, or a function (prev) => nextValue.
   * @param {"local" | "session"} [storageType="local"]
   * @returns {boolean}
   */
  update(key, updateValue, storageType = "local") {
    const currentData = this.get(key, null, storageType);

    if (currentData === null) {
      console.warn(
        `[Storage Warning]: Key "${key}" does not exist. Creating new record.`,
      );
    }

    let newData;

    if (typeof updateValue === "function") {
      newData = updateValue(currentData);
    } else if (
      typeof currentData === "object" &&
      currentData !== null &&
      typeof updateValue === "object"
    ) {
      // Merge objects
      newData = Array.isArray(currentData)
        ? [...currentData, ...updateValue]
        : { ...currentData, ...updateValue };
    } else {
      // Direct overwrite for primitives
      newData = updateValue;
    }

    return this.set(key, newData, storageType);
  }

  /**
   * DELETE / REMOVE: Delete a specific item from storage.
   * @param {string} key - The key name.
   * @param {"local" | "session"} [storageType="local"]
   */
  remove(key, storageType = "local") {
    try {
      const storage = this.#getStorage(storageType);
      storage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Storage Error]: Could not remove key "${key}"`, error);
      return false;
    }
  }

  /**
   * CLEAR ALL: Empty all records from target storage.
   * @param {"local" | "session"} [storageType="local"]
   */
  clear(storageType = "local") {
    try {
      const storage = this.#getStorage(storageType);
      storage.clear();
      return true;
    } catch (error) {
      console.error(
        `[Storage Error]: Could not clear ${storageType}Storage`,
        error,
      );
      return false;
    }
  }

  /**
   * CHECK: Verify if a key exists in storage.
   * @param {string} key
   * @param {"local" | "session"} [storageType="local"]
   * @returns {boolean}
   */
  has(key, storageType = "local") {
    const storage = this.#getStorage(storageType);
    return storage.getItem(key) !== null;
  }
}

// Export a single instance to use across your application
export const storage = new StorageService();
