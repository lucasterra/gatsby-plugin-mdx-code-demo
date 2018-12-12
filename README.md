# gatsby-plugin-mdx-code-demo

Create inline code demos with MDX. This plugin is heavily inspired by [material-ui](https://material-ui.com)'s wonderful documentation. It allows you to write demos like [theirs](https://material-ui.com/demos/buttons/).

## Example

First you need to have a `demoComponent` setup (see further installation instructions below). i.e.:
```javascript
// DemoComponent.js
import React from 'react';

// This is a container component to render our demos and their code
function DemoComponent({ code, children }) {
  return (
    <div>
      <pre>{code}</pre> {/* syntax highlighted code block*/}
      <div>
        {children} {/* the react rendered demo */}
      </div>
    </div>
  );
}

export default DemoComponent
```

Create a Markdown file with a link markup to the JS file, using protocol `demo` for the url. The paths are relative to your Markdown file's path.
```markdown
## Default

[Buttons](demo://outlinedButtons.js)

```

Write a React component (default exported) to be rendered in place of the markup.
```javascript
// outlinedButtons.js
import React from 'react';
import Button from '@material-ui/core/Button';

function OutlinedButtons() {
  return (
    <>
      <Button variant="outlined">
        Default
      </Button>
      <Button variant="outlined" color="primary">
        Primary
      </Button>
      <Button variant="outlined" color="secondary">
        Secondary
      </Button>
      <Button variant="outlined" disabled>
        Disabled
      </Button>
      <Button variant="outlined" href="#outlined-buttons">
        Link
      </Button>
    </>
  );
}

// Demos must be default exported
export default OutlinedButtons;
```

## Install

`npm install --save gatsby-mdx gatsby-plugin-mdx-code-demo`

## How to use

```javascript
// In your gatsby-config.js
plugins: [
  {
    resolve: 'gatsby-mdx',
    options: {
      extensions: ['.mdx', '.md'],
      gatsbyRemarkPlugins: [
        {
          resolve: `gatsby-plugin-mdx-code-demo`,
          options: {
            demoComponent: './src/components/DemoComponent', // a container component to render your demos 
          },
        },
        { resolve: 'gatsby-remark-prismjs' }, // needed for generating syntax highlighted code
      ]
    }
  }
]
```
