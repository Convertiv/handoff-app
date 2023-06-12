import Handoff from './dist/handoff.js';

const handoff = new Handoff({
    title: 'Handoff Custom',
});

handoff.postIntegration((documentationObject) => {
    console.log('This hook is called after the documentation is built and before stored.');
});
await handoff.init();
await handoff.fetch();
process.exit(0);
