import React from 'react';
import * as stories from '../../stories/Button.stories';
import { renderToStaticMarkup } from 'react-dom/server';
import { composeStories } from '@storybook/react';


// Iterate over Storybook components and generate HTML
const generateHTML = (source) => {
    const stories = composeStories(source);
    let html = '';
    Object.keys(stories).forEach((key) => {
        const story = stories[key];
        const { args, component } = story;
        const Component = component;
        const componentHTML = renderToStaticMarkup(
            <Component {...args} />
        );
        html += componentHTML;
    }
    return html;
};

// Usage
const StorybookHTML = () => {
    const html = generateHTML();

    return (
        <div dangerouslySetInnerHTML={{ __html: html }} />
    );
};

export default StorybookHTML;
