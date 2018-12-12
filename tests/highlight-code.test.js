const highlight = require('../highlight-code');
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

describe('highlight code', () => {
  it('should return a string formatted to jsx', () => {
    expect(highlight('jsx', demoCode)).toMatchSnapshot();
  });
});
