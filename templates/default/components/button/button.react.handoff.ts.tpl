import { defineCatalogItem, type Preview } from 'handoff-app/react';
import Button from './Button';

const item = defineCatalogItem({
  id: 'button',
  name: 'Button',
  description: 'Interactive button used for primary and secondary actions.',
  group: 'Atomic Elements',
  type: 'element',
  implementation: Button,
});

export default item;

type ButtonPreview = Preview<typeof item>;

export const Primary = {
  args: {
    type: 'primary',
    children: 'Click me!',
    showCounter: true,
  },
} satisfies ButtonPreview;

export const Secondary = {
  args: {
    type: 'secondary',
    children: 'Click me too!',
    showCounter: true,
  },
} satisfies ButtonPreview;
