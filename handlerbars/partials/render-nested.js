const Handlebars = require('handlebars');

Handlebars.registerPartial(
  'renderNested',

  `
{{~#if (isArray type)}}
[{{>renderNested type=type.[0] level=level}}]
{{~else if (isObject type)}}
{
{{#each type}}
{{#if (eq @key '_id')}}
{{#if (eq this 'ambiguous')}}
{{indent (sum ../level 1) '//'}} {{@key}}: false, Ambiguous usage of _ids, we could not detect if subDocuments use _id or not.
{{else if (eq this false)}}
{{indent (sum ../level 1) @key}}: {{this}},
{{/if}}
{{else}}
{{indent (sum ../level 1) (wq @key)}}: {{>renderNested type=this level=(sum ../level 1)}},
{{/if}}
{{/each}}
{{indent level '}'}}
{{else}}
{{type}}
{{~/if}}
`,
);
