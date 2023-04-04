# Frontend Integration

Handoff generates a set of tokens from a Figma file. These tokens need to be
mapped to your application. Out of the box Handoff supports integration with
Bootstrap 5.2. Other integrations are in progress and will be added when ready.

If you want to integrate with a custom frontend, or a framework we don't yet
natively support, you can use the custom code in this folder.

## Quick Start

1. Edit your config.js
2. Set the integrations.framework property to 'custom' and the version to 'false'
3. Edit the custom code provided in `integrations/custom`

## SASS Files
The SASS file contains the styles to map foundations and components to your 
framework. In the bootstrap base integration, this is divided in two 

- Maps associate tokens with bootstrap variables
- Components assign those variables to the proper classes

Your SAAS folder should have a main.scss or similar at the top level to allow
you to provide a single include.

## Preview Templates

This folder contains the logic for the component previews.
Each preview will be build with its own header, containing
a js and css file, and the html required to render the preview.

The files provided will give you a start using bootstrap
templates, but you can replace the boostrap with whatever
framework you are using.

You can also override the markup of the templates. In this
folder you should see a folder marked sample-button. If you
rename that folder to `button`, you will be able to override
the default preview.

The following components are supported

- alert
- button
- checkbox
- input
- pagination
- radio
- select
- switch
- tooltip

Create a folder named after a component. Then use the tokens
to create {template}.html files. For buttons, you can template
each type and size as well as the disabled state. For others,
you can template each state or orientation.

TODO: Document supported templates
