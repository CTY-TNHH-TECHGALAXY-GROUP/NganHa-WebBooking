const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const typescript = require('typescript');

const root = path.resolve(__dirname, '..');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  const mappedRequest = request.startsWith('@/')
    ? path.join(root, 'src', request.slice(2))
    : request;

  try {
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  } catch (error) {
    if (!path.extname(mappedRequest) && fs.existsSync(`${mappedRequest}.ts`)) {
      return originalResolveFilename.call(this, `${mappedRequest}.ts`, parent, isMain, options);
    }
    throw error;
  }
};

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
      jsx: typescript.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

const tests = require(path.join(root, 'src/lib/auth/__tests__/adminCapabilities.test.ts'));
tests.runAdminCapabilityTests()
  .then(() => console.log('Admin capability tests: PASS'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
