const { defineComponent } = require('handoff-app');

module.exports = defineComponent({
  renderer: 'react',
  id: 'button',
  name: 'Button',
  description: 'Interactive button used for primary and secondary actions.',
  group: 'Atomic Elements',
  type: 'element',
  entries: {
    component: './Button.jsx',
  },
  previews: {
    primary: {
      title: 'Primary',
      args: {
        type: 'primary',
        children: 'Click me!',
        showCounter: true,
      },
    },
    secondary: {
      title: 'Secondary',
      args: {
        type: 'secondary',
        children: 'Click me too!',
        showCounter: true,
      },
    },
  },
});
