/**
 * Traverses Express router stack to gather and display all registered endpoints.
 * @param {object} app - Express application instance
 */
const printRouteTable = (app) => {
  const routes = [];

  function traverse(router, pathPrefix = '') {
    if (!router || !router.stack) return;

    router.stack.forEach((layer) => {
      if (layer.route) {
        // Simple endpoint route
        const path = (pathPrefix + layer.route.path).replace(/\/+/g, '/');
        const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
        methods.forEach((method) => {
          routes.push({ method, path });
        });
      } else if (layer.name === 'router') {
        // Nested router instance
        let routePrefix = '';
        if (layer.regexp) {
          const source = layer.regexp.source;
          // Parse base path prefix from regex source
          const clean = source
            .replace(/^\\\//, '')
            .replace(/\\\//g, '/')
            .replace(/\/\?\(\?=\\\/\|\$\)/, '')
            .replace(/\^/, '')
            .replace(/\?\(\?=\/\|\$\)/, '')
            .replace(/\(\?:\\\/\(\?:\\\?\)\?\)/, '');
          
          const match = clean.match(/^([a-zA-Z0-9_\-\/]+)/);
          if (match) {
            routePrefix = '/' + match[1];
          }
        }
        traverse(layer.handle, pathPrefix + routePrefix);
      }
    });
  }

  traverse(app._router, '');

  console.log('\n--- Registered Endpoints Table ---');
  routes.forEach((r) => {
    console.log(`${r.method.padEnd(8)} ${r.path}`);
  });
  console.log('----------------------------------\n');
};

module.exports = { printRouteTable };
