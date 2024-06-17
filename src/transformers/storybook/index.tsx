import React from 'react';
import * as stories from '../../stories/Button.stories';
import { renderToStaticMarkup } from 'react-dom/server';
import { composeStories } from '@storybook/react';
import Mustache from 'mustache';
import { parse } from 'node-html-parser';
import { DocumentationObject, ComponentDefinitionOptions } from '../../types';
import Handoff from '../../index';

// Iterate over Storybook components and generate HTML
const generateHTML = async (source) => {
  const stories = composeStories(source);
  let html = '';
  Object.keys(stories).forEach((key) => {
    const story = stories[key];
    console.log(stories);
    //     const { args, component } = story;
    //     const Component = component;
    //     const componentHTML = renderToStaticMarkup(
    //         <Component {...args} />
    //     );
    //     html += componentHTML;
    // }
    // return html;
  });
};

// Usage
// const StorybookHTML = () => {
//     const html = generateHTML();

//     return (
//         <div dangerouslySetInnerHTML={{ __html: html }} />
//     );
// };
const storybookPreviewTransformer = async (handoff: Handoff, documentationObject: DocumentationObject) => {
  return await generateHTML(stories);
};

export default storybookPreviewTransformer;
