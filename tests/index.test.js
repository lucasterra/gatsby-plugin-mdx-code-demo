// @ts-nocheck
jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');
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
    fs.stat.mockReset();
    fs.stat.mockImplementation((file, cb) => {
      cb(null, { isFile: true, isMock: true });
    });

    fs.readFile.mockReset();
    fs.readFile.mockImplementation((file, openMode, cb) => {
      cb(null, demoCode);
    });

    path.dirname.mockReset();
    path.dirname.mockReturnValue('/path/to/some_directory');

    path.join.mockReset();
    path.join.mockReturnValue('/path/to/some_directory/static-appbar.js');
  });

  describe('include code demo', () => {
    let compiler;
    beforeAll(async() => {
      const demoPlugin = () => async (tree) => {
        await plugin(
          { markdownAST: tree, markdownNode: { fileAbsolutePath: __dirname } },
          { demoComponent: './demo-test' },
        );
      };

      compiler = (text) => mdx(text, { remarkPlugins: [[demoPlugin]] });
    });

    it('should work as expected', async () => {
      const textAST = await compiler(mdxText);
      expect(textAST).toMatchSnapshot();
    });
  });
});
