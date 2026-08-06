// A key path is a dot-separated string addressing a nested property, where a
// literal dot in a key is escaped as `\.` -- which is what lets a setting name
// such as `editor.invisibles.cr` be told apart from one whose key really does
// contain a dot.
//
// Inlined from the archived atom/key-path-helpers. Only the three functions
// this package uses are kept.

const ESCAPED_DOT = /\\\./g;

function splitKeyPath(keyPath) {
  if (keyPath == null) return [];

  let startIndex = 0;
  const keyPathArray = [];

  for (let i = 0, len = keyPath.length; i < len; i++) {
    if (keyPath[i] === "." && (i === 0 || keyPath[i - 1] !== "\\")) {
      keyPathArray.push(keyPath.substring(startIndex, i).replace(ESCAPED_DOT, "."));
      startIndex = i + 1;
    }
  }
  keyPathArray.push(keyPath.substring(startIndex).replace(ESCAPED_DOT, "."));

  return keyPathArray;
}

function hasKeyPath(object, keyPath) {
  for (const key of splitKeyPath(keyPath)) {
    if (object == null || !Object.hasOwn(object, key)) {
      return false;
    }
    object = object[key];
  }
  return true;
}

function getValueAtKeyPath(object, keyPath) {
  if (!keyPath) return object;

  for (const key of splitKeyPath(keyPath)) {
    object = object[key];
    if (object == null) {
      return object;
    }
  }
  return object;
}

module.exports = { splitKeyPath, hasKeyPath, getValueAtKeyPath };
