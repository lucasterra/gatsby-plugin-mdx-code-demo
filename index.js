// @ts-nocheck
/* eslint no-param-reassign: ["off"] */

const fs = require('fs');
const crypto = require('crypto');
const { join, dirname } = require('path');
const map = require('unist-util-map');
const normalizePath = require('normalize-path');
const highlightCode = require('./highlight-code');

const CODE_DEMO_URL_REGEX = /^demo:\/\/(.+)/;

function convertNodeToLocalDemo(node, parent, code, componentName) {
  const highlightedCode = highlightCode('jsx', code);

  delete parent.children;
  parent.type = 'html';
  parent.value = `<DemoComponent code={${highlightedCode}}><${componentName}/></DemoComponent>`;
}

module.exports = ({ markdownAST, markdownNode }, { demoComponent } = {}) => {
  const directory = dirname(markdownNode.fileAbsolutePath) + '/';
  if (!demoComponent) {
    throw Error('Required CODEDEMO option "demoComponent" not specified');
  } else if (!fs.existsSync(demoComponent)) {
    throw Error(
      `Invalid CODEDEMO "demoComponent" specified "${demoComponent}"`,
    );
  }

  // Components which will get injected at the top of MDX file
  const injectedComponentsHash = {
    [demoComponent]: 'DemoComponent',
  };

  const getFilePath = (path) => {
    let filePath = path;
    if (!filePath.includes('.')) {
      filePath += '.js';
    }
    filePath = normalizePath(join(directory, filePath));

    return filePath;
  };

  // iterate inlineCode to find our regex
  map(markdownAST, (node, index, parent) => {
    if (node.type === 'link') {
      const match = node.url.match(CODE_DEMO_URL_REGEX);

      if (match) {
        const filePath = getFilePath(match[1]);
        const filePathHash = crypto
          .createHash('md5')
          .update(filePath)
          .digest('hex');

        const componentName = `Demo_${filePathHash}`;

        if (!fs.existsSync(filePath)) {
          throw Error(
            `Invalid CODEDEMO link specified; no such file "${filePath}"`,
          );
        }

        const code = fs.readFileSync(filePath, 'utf8');

        convertNodeToLocalDemo(node, parent, code, componentName);
        injectedComponentsHash[filePath] = componentName;
      }
    }

    // No change
    return node;
  });

  const injectedComponents = Object.keys(injectedComponentsHash).map(
    (filePath) => ({
      type: 'import',
      default: false,
      value: `import ${injectedComponentsHash[filePath]} from '${filePath}'`,
    }),
  );
  markdownAST.children = [...injectedComponents, ...markdownAST.children];

  return markdownAST;
};
