// @ts-check
const { buildTmpDir } = require('./build/scripts');

(async function () {
  await buildTmpDir();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
