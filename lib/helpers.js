(function () {
  var checkValueAtKeyPath, deepClone, deepDefaults, isPlainObject, splitKeyPath;

  ({ splitKeyPath } = require("./key-path"));

  // Public: Check if `value` is an {Object}
  isPlainObject = function (value) {
    return (value != null ? value.constructor : void 0) === Object;
  };

  // Public: Get an object's value for a given key-path, and also an indication
  // of whether or not the object would affect the key-path in a deep-merge.

  // Returns an {Array} with two elements:
  // * `value` The value at the given key-path, or `undefined` if there isn't one.
  // * `hasValue` A {Boolean} value:
  //   * `true` if `object` would override the given key-path if deep-merged
  //      into another {Object} (see {::deepDefaults}). This means either `object`
  //      has a value for the given key-path, `object` is not an {Object}, or one
  //      of `object`'s children on the key-path is not an {Object}.
  //   * `false` if the object would not alter the given key-path if deep-merged
  //     into another {Object}.
  checkValueAtKeyPath = function (object, keyPath) {
    var i, key, len, ref;
    ref = splitKeyPath(keyPath);
    for (i = 0, len = ref.length; i < len; i++) {
      key = ref[i];
      if (isPlainObject(object)) {
        if (Object.hasOwn(object, key)) {
          object = object[key];
        } else {
          return [void 0, false];
        }
      } else {
        return [void 0, true];
      }
    }
    return [object, true];
  };

  // Public: Fill in missing values in `target` with those from `defaults`,
  // recursing into any nested {Objects}
  deepDefaults = function (target, defaults) {
    var i, key, len, ref;
    if (isPlainObject(target) && isPlainObject(defaults)) {
      ref = Object.keys(defaults);
      for (i = 0, len = ref.length; i < len; i++) {
        key = ref[i];
        if (Object.hasOwn(target, key)) {
          deepDefaults(target[key], defaults[key]);
        } else {
          target[key] = defaults[key];
        }
      }
    }
  };

  deepClone = function (value) {
    var i, key, len, ref, result;
    if (Array.isArray(value)) {
      return value.map(function (element) {
        return deepClone(element);
      });
    } else if (isPlainObject(value)) {
      result = {};
      ref = Object.keys(value);
      for (i = 0, len = ref.length; i < len; i++) {
        key = ref[i];
        result[key] = deepClone(value[key]);
      }
      return result;
    } else {
      return value;
    }
  };

  module.exports = { isPlainObject, checkValueAtKeyPath, deepClone, deepDefaults };
}).call(this);
