/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-restricted-syntax */
// @ts-nocheck
/* eslint no-param-reassign: ["off"] */

const fs = require('fs');
const { sync: mkdirp } = require('mkdirp');
const crypto = require('crypto');
const { join, isAbsolute } = require('path');
const visit = require('unist-util-visit');
const normalizePath = require('normalize-path');
const os = require('os');

const CACHE_LOCATION = 'code-demo-imports';

let tmpDir;
function createTempDir() {
  if (tmpDir) {
    return tmpDir;
  }
  tmpDir = fs.mkdtempSync(join(os.tmpdir(), CACHE_LOCATION));
  return tmpDir;
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function convertNodeToInlineDemo(code, componentName, lang, position) {
  // return {
  //   type: 'jsx',
  //   value: `<CodeDemo code={${JSON.stringify(
  //     code,
  //   )}} lang="${lang}"><${componentName}/></CodeDemo>`,
  //   position,
  // };
  return {
    type: 'mdxJsxFlowElement',
    name: 'CodeDemo',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'code', value: JSON.stringify(code) },
      { type: 'mdxJsxAttribute', name: 'lang', value: lang },
    ],
    children: [
      {
        type: 'mdxJsxFlowElement',
        name: componentName,
        attributes: [],
        children: [],
        data: { _mdxExplicitJsx: true },
      },
    ],
    position,
    data: { _mdxExplicitJsx: true },
  };
}

function createTemporaryFile(code, componentName, cachePath, componentsMap) {
  const filePath = normalizePath(join(cachePath, `${componentName}.js`));
  fs.writeFileSync(filePath, code, { encoding: 'utf-8' });

  componentsMap.set(filePath, componentName);

  return filePath;
}

function createImportAST(name, filePath) {
  // return {
  //   type: 'import',
  //   value: `import ${name} from '${filePath}'`,
  // };
  return {
    type: 'mdxjsEsm',
    value: `import ${name} from '${filePath}';`,
    data: {
      estree: {
        type: 'Program',
        body: [
          {
            type: 'ImportDeclaration',
            specifiers: [
              {
                type: 'ImportDefaultSpecifier',
                local: {
                  type: 'Identifier',
                  name,
                },
              },
            ],
            source: {
              type: 'Literal',
              value: filePath,
              raw: `'${filePath}'`,
            },
          },
        ],
        sourceType: 'module',
        comments: [],
      },
    },
  };
}

function remarkCodeDemo(opts = {}) {
  const rootDir = opts.rootDir || process.cwd();

  if (!isAbsolute(rootDir)) {
    throw new Error('"rootDir" has to be an absolute path');
  }

  const cacheDirectory = createTempDir();

  return function transformer(tree, file) {
    // console.dir(tree, { depth: 100 });
    // Components which will get injected at the top of MDX file
    const componentsMap = new Map();
    const cachePath = normalizePath(cacheDirectory);
    mkdirp(cachePath);

    const nodeIdHash = md5(file.value);

    let idx = 0;
    visit(tree, 'code', (node, index, parent) => {
      const metaParams = (node.meta || '').split(/\s+/);
      if (metaParams.indexOf('codeDemo') === -1) {
        return;
      }

      const { position, value: code, lang = 'js' } = node;
      const componentName = `LocalComponent_${nodeIdHash}_${idx}`;

      // update node to an mdx component
      parent.children[index] = convertNodeToInlineDemo(
        code,
        componentName,
        lang,
        position,
      );
      createTemporaryFile(code, componentName, cachePath, componentsMap);
      idx += 1;
    });

    const importAST = [];
    for (const [componentName, filePath] of componentsMap.entries()) {
      importAST.push(createImportAST(filePath, componentName));
    }

    tree.children = [...importAST, ...tree.children];

    return tree;
  };
}

module.exports.remarkCodeDemo = remarkCodeDemo;
