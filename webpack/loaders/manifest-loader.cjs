'use strict';
var __importDefault = (this && this.__importDefault) || function(mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
var fs_1 = __importDefault(require('fs'));
var path_1 = __importDefault(require('path'));
// This is duplicated from util/manifest.ts
// For some reason webpack throws a `require() of ES modules is not supported.` error
// when trying to import? :shrug:
var recurseDir = function(dir) {
  return fs_1.default
    .readdirSync(dir, { withFileTypes: true })
    .flatMap(function(file) {
      var relPath = path_1.default.join(dir, file.name);
      if (file.isDirectory())
        return recurseDir(relPath);
      return relPath;
    });
};
var ignorePathRegexes = [
  /(?:^|\/)\w*_manifest\.txt$/,
  /(?:^|\/)readme\.\w*$/i,
];
var findManifestFiles = function(dir) {
  var actualDir = fs_1.default.lstatSync(dir).isFile() ? path_1.default.dirname(dir) : dir;
  return recurseDir(actualDir)
    .map(function(file) {
      return path_1.default.relative(actualDir, file);
    })
    // Exclude specific paths
    .filter(function(file) {
      return !ignorePathRegexes.some(function(regex) {
        return regex.test(file);
      });
    });
};
function default_1(_content) {
  this.cacheable(false);
  var lines = findManifestFiles(path_1.default.dirname(this.resourcePath));
  var importStr = '';
  var outputStr = 'export default {';
  lines.forEach(function(rawName, fileIdx) {
    // normalize filepaths between windows / unix
    var name = rawName.replace(/\\/g, '/').replace(/^\//, '');
    // Use static imports instead of dynamic ones to put files in the bundle.
    var fileVar = 'file'.concat(fileIdx);
    importStr += 'import '.concat(fileVar, ' from \'./').concat(name, '\';\n');
    outputStr += '\''.concat(name, '\': ').concat(fileVar, ',');
  });
  outputStr += '};';
  return ''.concat(importStr, '\n').concat(outputStr);
}
exports.default = default_1;
