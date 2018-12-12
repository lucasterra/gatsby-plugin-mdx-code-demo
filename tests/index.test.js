// @ts-nocheck
jest.mock('fs');

const fs = require('fs');
const mdx = require('@mdx-js/mdx');
const plugin = require('../index');

// Mocks
const mdxText = `
# Title

[StaticAppBar](demo://static-appbar.js)

Lorem ipsum dolor sit amet.
`;

const demoCode = `
// prettier-ignore-start
import React from 'react'
// I wanna add some comments, just to make sure it will also escape them

const StaticAppBar = () => {
  return (
    <div>This is my appbar, it is so cool, right?</div>
  );
}

export default StaticAppBar
// prettier-ignore-end
`;

describe('gatsby-mdx-code-demo', () => {
  beforeEach(() => {
    fs.existsSync.mockReset();
    fs.existsSync.mockReturnValue(true);

    fs.readFileSync.mockReset();
    fs.readFileSync.mockReturnValue(demoCode);
  });

  describe('include code demo', () => {
    let compiler;
    beforeAll(() => {
      const demoPlugin = () => (tree) => {
        plugin(
          { markdownAST: tree, markdownNode: { fileAbsolutePath: __dirname } },
          { demoComponent: './demo-test' },
        );
      };

      compiler = (text) => mdx.sync(text, { mdPlugins: [[demoPlugin]] });
    });

    it('should work as expected', () => {
      const textAST = compiler(mdxText);
      expect(textAST).toMatchSnapshot();
    });
  });
});