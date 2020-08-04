# gatsby-plugin-mdx-code-demo

Create inline code demos with MDX. This plugin is heavily inspired by [material-ui](https://material-ui.com)'s wonderful documentation. It allows you to write demos like [theirs](https://material-ui.com/demos/buttons/).

**Breaking changes in v2. The usage is radically simplified compared to v0 and v1, but they are totally uncompatible.**

## Example usage

To enable a `CodeDemo` just add the `codeDemo` metadata after the language in your MDX code block. The React component you want to demo needs to be default exported.

````markdown
---
title: Buttons Documentation
---

## Buttons

Here is an example Button in action:

```jsx codeDemo
import React from 'react';
import Button from '@material-ui/core/Button';

function OutlinedButtons() {
  return (
    <>
      <Button variant="outlined">Default</Button>
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
````

## Install

```bash
npm install --save gatsby-plugin-mdx gatsby-plugin-mdx-code-demo
```

## Setup

1. Add `gastby-plugin-mdx-code-demo` to your `gastby-config.js` file

```jsx
// In your gatsby-config.js
plugins: [
  {
    resolve: 'gatsby-plugin-mdx',
    options: {
      gatsbyRemarkPlugins: ['gatsby-plugin-mdx-code-demo'],
    },
  },
];
```

2. Create a `CodeDemo` component. To highlight the `code block` you can use [`prism-react-renderer`](https://github.com/FormidableLabs/prism-react-renderer).

```jsx
// src/components/CodeDemo.js
import React from 'react';

// This is a container component to render our demos and their code
export function CodeDemo(props) {
  const { code, children } = props;

  return (
    <div>
      <pre>{code}</pre> {/* code block as a string */}
      <div>
        {children} {/* the react rendered demo */}
      </div>
    </div>
  );
}
```

3. Make `CodeDemo` available through your `MDXProvider`

```jsx
// src/components/Layout.js
import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import { CodeDemo } from './CodeDemo';

function Layout(props) {
  const mdxComponents = {
    h1: (props) => <h1 {...props} />,
    // more components
    CodeDemo: (props) => <CodeDemo {...props} />,
  };

  return <MDXProvider components={mdxComponents}>{props.children}</MDXProvider>;
}

export default Layout;
```

## FAQ?

1. _How does it differ from [`react-live`](https://github.com/FormidableLabs/react-live)?_  
   `react-live` will let you live edit your views, but it brings [`buble`](https://github.com/bublejs/buble) as a dependency. All of `gatsby-plugin-mdx-code-demo`'s magic happens at build time, so there is no dependency included. If you don't expect your users to edit your demos in real time `react-live` is probably overkill.

2. _How does it differ from [`react-view`](https://github.com/uber/react-view)?_  
   The same as above applies to `react-view`, except `react-view` brings in [`babel`](https://github.com/babel/babel) as a dependency. Also, [`react-view` doesn't currently work with Gatsby](https://github.com/uber/react-view/issues/31).
