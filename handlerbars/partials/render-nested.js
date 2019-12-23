const Handlebars = require('handlebars');

Handlebars.registerPartial(
  'renderNested',

  `
{{~#if (isArray type)}}
[{{>renderNested type=type.[0] level=level}}]
{{~else if (isObject type)}}
{
{{#each type}}
{{indent (sum ../level 1) @key}}: {{>renderNested type=this level=(sum ../level 1)}},
{{/each}}
{{indent level '}'}}
{{else}}
{{type}}
{{~/if}}
`,
);
