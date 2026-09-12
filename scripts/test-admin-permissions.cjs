const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const typescript = require('typescript');

const root = path.resolve(__dirname, '..');
const permissionsRoute = fs.readFileSync(path.join(root, 'src/app/api/admin/editor-permissions/route.ts'), 'utf8');
const adminAction = fs.readFileSync(path.join(root, 'src/lib/auth/adminAction.ts'), 'utf8');
const adminLayout = fs.readFileSync(path.join(root, 'src/app/admin/layout.tsx'), 'utf8');
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
if (!permissionsRoute.includes("withCapability") || !permissionsRoute.includes("webbooking_replace_editor_capabilities")) {
  throw new Error('Editor permissions route must remain server-side capability protected and RPC-backed');
}
if (!adminAction.includes('authorizeCapability') || !adminLayout.includes('/admin/analytics') || !adminLayout.includes('/admin/editor-permissions')) {
  throw new Error('Admin navigation must use the server-returned capability gates');
}
tests.runAdminCapabilityTests()
  .then(() => console.log('Admin capability tests: PASS'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
