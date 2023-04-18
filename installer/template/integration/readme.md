# Frontend Integration

Handoff generates a set of tokens from a Figma file. These tokens need to be
mapped to your application. Out of the box Handoff supports integration with
Bootstrap 5.2. Other integrations are in progress and will be added when ready.

If you want to integrate with a custom frontend or customize your current 
integration you will do that in this folder.  

See the structure 

## Current integration support
- Bootstrap (5.2)

## Using an integration
1. Edit your config js
2. Find the integration property
3. Set the name to the name of your integration in lowercase (ex. `name: 'bootstrap'`)
4. Set the version to the major and minor version you want to use (ex. `version: '5.2'`)
5. The next time you run the fetch, a folder will show up in your exported dir called `{name}-tokens`.

## Integration structure
Integrations have two folders `sass` and `templates`.  The `sass` directory 
should contain an entrypoint.scss file that you can include in your projects
and then should contain two folders `maps` and `extended`.

### SASS

`maps` are for mapping handoff tokens to variables. For example, in bootstrap, 
there are a large set of prebuilt variables.  Using the maps you can set these
vars with exported values.  `$btn-border-width-sm $button-sm-border-width;`

`extended` is for defining extensions on top of maps. This is used for defining
classes and mapping exported tokens to specific properties of the class. You
can use the types defined in `exported/tokens/types` to iterate across the 
various defined types and apply the exported tokens to your project.

### Templates
`templates` are for defining how components get displayed in your Handoff site.
Each frontend framework uses a different structure, classes, and patterns.
In `templates` you'll find a list of template folders, one for each component
plus a css and js file that allows you to define the 

## Customizing an existing integration
Files placed in the integrations folder will automatically override the version
from the default. So if you want to override the Buttons map, you could create
a file at `sass/maps/button.scss`.  Anything in that folder will override the
defaults.  

You can find the structure of the integration at 
https://github.com/Convertiv/handoff-app/tree/main/integrations. So if you are
using boostrap/5.2 and you want to customize the buttons map, copy 
`/integrations/bootstrap/5.2/sass/maps/button.scss` into 
`/integration/sass/maps/button.scss` and it will override the default.

## Creating a custom integration
Copy the integration starter found at 
https://github.com/Convertiv/handoff-app/tree/main/integrations/starter/ to
your integration directory. This directory should have `sass` and `templates` 
directories. 

Start with `/integration/sass/main.scss`. If you are using a framework, you
can use npm to install it in your project. Include any required css and sass
in the main.scss.

Then start customizing the mapping files at `sass/maps`.  You can map each 
component to your frameworks variables.

Finally, use the `sass/extended` folder to map to specific classes and css
structures. This allows you to use tokens in places where your framework doesn't
have variables already established.

## SASS Files
The SASS file contains the styles to map foundations and components to your 
framework. In the bootstrap base integration, this is divided in two 

- Maps associate tokens with bootstrap variables
- Components assign those variables to the proper classes

Your SAAS folder should have a main.scss or similar at the top level to allow
you to provide a single include.

## Templates

This folder contains the logic for the component previews.
Each preview will be build with its own header, containing
a js and css file, and the html required to render the preview.

The files provided will give you a start using bootstrap
templates, but you can replace the boostrap code with whatever
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
