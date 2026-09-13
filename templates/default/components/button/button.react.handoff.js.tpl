const { defineCatalogItem } = require('handoff-app/react');
const Button = require('./Button').default;

exports.default = defineCatalogItem({
  id: 'button',
  name: 'Button',
  description: 'Interactive button used for primary and secondary actions.',
  group: 'Atomic Elements',
  type: 'element',
  implementation: Button,
});

exports.Primary = {
  args: {
    type: 'primary',
    children: 'Click me!',
    showCounter: true,
  },
};

exports.Secondary = {
  args: {
    type: 'secondary',
    children: 'Click me too!',
    showCounter: true,
  },
};
