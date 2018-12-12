const { languages, highlight } = require('prismjs');
const loadLanguages = require('prismjs/components/');
const HTMLtoJSX = require('htmltojsx');

const converter = new HTMLtoJSX({
  createClass: false,
});

module.exports = (language, code) => {
  loadLanguages([language]);
  const grammar = languages[language];

  return converter.convert(
    `<div class="gatsby-highlight"><pre class="language-${language}"><code>${highlight(
      code,
      grammar,
      language,
    )}</code></pre></div>`,
  );
};
