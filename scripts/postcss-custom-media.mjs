// A tiny PostCSS plugin for custom media: `@media (--name)` becomes the query
// the map names, so a query is defined once (in TypeScript, where JS reads it
// too) and stylesheets refer to it by name. Browsers don't support
// `@custom-media` yet; this does only the substitution, not the declaration.
// An unknown name fails the build rather than shipping a query that never matches.

/** @param {Readonly<Record<string, string>>} queries custom media name (`--x`) → media query */
export function customMedia(queries) {
  return {
    postcssPlugin: 'custom-media',
    AtRule: {
      media(rule) {
        rule.params = rule.params.replace(/\((--[\w-]+)\)/g, (_, name) => {
          const query = queries[name];
          if (!query) throw rule.error(`Unknown custom media ${name}`);
          return query;
        });
      },
    },
  };
}
customMedia.postcss = true;
