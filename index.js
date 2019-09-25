// @ts-nocheck
/* eslint no-param-reassign: ["off"] */

const fs = require('fs');
const { promisify } = require('util');
const crypto = require('crypto');
const { join, dirname } = require('path');
const visit = require('unist-util-visit');
const normalizePath = require('normalize-path');
const highlightCode = require('./highlight-code');

const readFile = promisify(fs.readFile);

const CODE_DEMO_URL_REGEX = /^demo:\/\/(.+)/;

function convertNodeToLocalDemo(node, parent, code, componentName) {
  const highlightedCode = highlightCode('jsx', code);

  delete parent.children;
  parent.type = 'jsx';
  parent.value = `<DemoComponent code={${highlightedCode}}><${componentName}/></DemoComponent>`;
}

function fileExists(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(stats.isFile());
    });
  });
}

function addSuffix(path, suffix) {
  if (!path.endsWith(suffix)) {
    return path + suffix;
  }

  return path;
}

module.exports = async (
  { markdownAST, markdownNode },
  { demoComponent } = {},
) => {
  if (!demoComponent) {
    throw Error('Required CODEDEMO option "demoComponent" not specified');
  }

  const demoComponentPath = addSuffix(normalizePath(demoComponent), '.js');
  if (!(await fileExists(demoComponentPath))) {
    throw Error(
      `Invalid CODEDEMO "demoComponent" specified "${demoComponentPath}"`,
    );
  }

  // Components which will get injected at the top of MDX file
  const injectedComponentsHash = {
    [demoComponentPath]: 'DemoComponent',
  };

  const directory = normalizePath(dirname(markdownNode.fileAbsolutePath));
  const getFilePath = (path) => {
    let filePath = addSuffix(path, '.js');
    filePath = normalizePath(join(directory, filePath));

    return filePath;
  };

  const nodesToChange = [];

  // iterate inlineCode to find our regex
  visit(markdownAST, 'link', (node, index, parent) => {
    const match = node.url.match(CODE_DEMO_URL_REGEX);

    if (match) {
      const filePath = getFilePath(match[1]);
      const filePathHash = crypto
        .createHash('md5')
        .update(filePath)
        .digest('hex');

      const componentName = `Demo_${filePathHash}`;

      nodesToChange.push({
        node,
        parent,
        filePath,
        componentName,
      });
      injectedComponentsHash[filePath] = componentName;
    }
  });

  await Promise.all(
    nodesToChange.map(async (n) => {
      if (!(await fileExists(n.filePath))) {
        throw Error(
          `Invalid CODEDEMO link specified; no such file "${n.filePath}"`,
        );
      }

      const code = await readFile(n.filePath, 'utf8');
      convertNodeToLocalDemo(n.node, n.parent, code, n.componentName);
    }),
  );

  const injectedComponents = Object.keys(injectedComponentsHash).map(
    (filePath) => ({
      type: 'import',
      value: `import ${
        injectedComponentsHash[filePath]
      } from '${filePath.replace(`${directory}/`, './')}'`,
    }),
  );

  if (injectedComponents.length > 1) {
    markdownAST.children = [...injectedComponents, ...markdownAST.children];
  }

  return markdownAST;
};
