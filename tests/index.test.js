// @ts-nocheck
jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');
const mdx = require('@mdx-js/mdx');
const plugin = require('../index');

const actualPath = jest.requireActual('path');

// Mocks
const mdxText = `
# Title

[StaticAppBar](demo://static-appbar.js)
\`\`\`jsx codeDemo highlight test
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
\`\`\`

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
    fs.existsSync.mockImplementation(() => true);

    fs.readFile.mockReset();
    fs.readFile.mockImplementation(() => demoCode);

    fs.writeFileSync.mockReset();
    fs.writeFileSync.mockImplementation(() => null);

    fs.mkdirSync.mockReset();
    fs.mkdirSync.mockImplementation(() => null);

    const cwdSpy = jest.spyOn(process, 'cwd');
    cwdSpy.mockReturnValue('\\path\\to\\some_directory');

    path.dirname.mockReset();
    path.dirname.mockReturnValue('\\path\\to\\some_directory');

    path.join.mockReset();
    path.join.mockImplementation(actualPath.join);
  });

  describe('include code demo', () => {
    let compiler;
    beforeAll(async () => {
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
