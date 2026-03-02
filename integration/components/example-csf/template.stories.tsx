import React from 'react';

const Card = ({ title, body, featured }) => (
  <div className={`example-csf-card ${featured ? 'is-featured' : ''}`}>
    <h2>{title}</h2>
    <p>{body}</p>
  </div>
);

export default {
  title: 'Examples/Example CSF Card',
  component: Card,
  args: {
    title: 'CSF Card',
    body: 'Default body',
    featured: false,
  },
  argTypes: {
    title: { control: 'text', description: 'Card title' },
    body: { control: 'text', description: 'Card body' },
    featured: { control: 'boolean', description: 'Featured state' },
  },
};

export const Default = {};

export const Featured = {
  args: {
    featured: true,
    body: 'This is the featured story variant.',
  },
};
