# Preview Templates
This folder contains the logic for the component previews.
Each preview will be build with its own header, containing
a js and css file, and the html required to render the preview.

The files provided will give you a start using bootstrap
templates, but you can replace the boostrap with whatever
framework you are using.

You can also override the markup of the templates.  In this
folder you should see a folder marked sample-button.  If you
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

Create a folder named after a component.  Then use the tokens
to create {template}.html files.  For buttons, you can template
each type and size as well as the disabled state.  For others, 
you can template each state or orientation. 

TODO: Document supported templates