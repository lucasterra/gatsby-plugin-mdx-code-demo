/* eslint-disable no-restricted-syntax */
// @ts-nocheck
/* eslint no-param-reassign: ["off"] */

const fs = require('fs');
const { sync: mkdirp } = require('mkdirp');
const crypto = require('crypto');
const { join } = require('path');
const visit = require('unist-util-visit');
const normalizePath = require('normalize-path');

const CACHE_LOCATION = 'code-demo-imports';

function md5(str) {
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex');
}

function convertNodeToInlineDemo(code, componentName, lang, position) {
  return {
    type: 'jsx',
    value: `<CodeDemo code={${JSON.stringify(code)}} lang="${lang}"><${componentName}/></CodeDemo>`,
    position,
  };
}

function createTemporaryFile(
  code,
  componentName,
  cachePath,
  componentsMap,
) {
  const filePath = normalizePath(join(cachePath, `${componentName}.js`));
  fs.writeFileSync(filePath, code, { encoding: 'utf-8' });

  componentsMap.set(filePath, componentName);

  return filePath;
}

function createImportAST(name, filePath) {
  return {
    type: 'import',
    value: `import ${name} from '${filePath}'`,
  };
}

module.exports = (
  { markdownAST, markdownNode, cache },
  opts = {}, // eslint-disable-line no-unused-vars
) => {
  // Components which will get injected at the top of MDX file
  const componentsMap = new Map();
  const cachePath = normalizePath(
    join(cache.directory, CACHE_LOCATION),
  );
  mkdirp(cachePath);

  const nodeIdHash = md5(markdownNode.id);

  let idx = 0;
  visit(markdownAST, 'code', (node, index, parent) => {
    const metaParams = (node.meta || '').split(/\s+/);
    if (metaParams.indexOf('codeDemo') === -1) {
      return;
    }

    const { position, value: code, lang = 'js' } = node;
    const componentName = `LocalComponent_${nodeIdHash}_${idx}`;

    // update node to an mdx component
    parent.children[index] = convertNodeToInlineDemo(code, componentName, lang, position);
    createTemporaryFile(code, componentName, cachePath, componentsMap);
    idx += 1;
  });

  const importAST = [];
  for (const [componentName, filePath] of componentsMap.entries()) {
    importAST.push(createImportAST(filePath, componentName));
  }

  markdownAST.children = [...importAST, ...markdownAST.children];
  return markdownAST;
};
