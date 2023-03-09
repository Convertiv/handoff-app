// @ts-check
const runforestSvg = require('./svg');

(async function () {
  await runforestSvg({
    source: 'assets/svg/',
    destination: 'public/assets/',
    mode: 'build',
  });
})();
