import React from 'react';

const Card = ({ title, subtitle, featured }) => (
  <div className={`example-csf-card ${featured ? 'is-featured' : ''}`}>
    <h2>{title}</h2>
    <p>{subtitle}</p>
  </div>
);

export default {
  title: 'Examples/Example CSF Card',
  component: Card,
  args: {
    title: 'CSF Card',
    subtitle: 'Default subtitle',
    featured: false,
  },
  argTypes: {
    title: { control: 'text', description: 'Card title' },
    subtitle: { control: 'text', description: 'Card subtitle' },
    featured: { control: 'boolean', description: 'Featured state' },
  },
};

export const Default = {};

export const Featured = {
  args: {
    featured: true,
    subtitle: 'This is the featured story variant.',
  },
};
