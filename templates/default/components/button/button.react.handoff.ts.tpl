import { defineReactComponent } from 'handoff-app';
import Button from './Button';

export default defineReactComponent(Button, {
  id: 'button',
  title: 'Button',
  description: 'Interactive button used for primary and secondary actions.',
  group: 'Atomic Elements',
  type: 'element',
  entries: {
    component: './Button.tsx',
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
