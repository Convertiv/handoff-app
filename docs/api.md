# Handoff API

Handoff exposes a Javascript API allowing you to easily integrate Handoff into
existing Node based applications, CI/CD, and command line tools. This API also
allows you to hook into the pipeline execution and generate new build artifacts
during the execution.

## Example Project

Here's a demo project you can check out to get started fast
https://github.com/Convertiv/handoff-0-6-0/

## Get Started

1. Run `npm install --save handoff-app`
2. Add handoff to your code. Create `handoff.ts`

```js
import Handoff from 'handoff-app';

const handoff = new Handoff({
  // You can customize the configuration here
});
handoff.fetch();
```

3. Build your typescript `tsc`
4. Run your project `node handoff.js`

## The API

### Methods

Methods of the handoff class can be called to run actions in the

#### init

```js
handoff.init();
```

Init will check and build the local state, including the configuration. You
probably don't need to call this method since it is executed as part of the
class constructor

#### fetch

```js
handoff.fetch();
```

Fetch will connect to the defined Figma file id provided in the
`env`. If no env or file is found, it will interactively request one. Then it
will export all of the tokens and generated data into an `exported` directory
in the local working root.

#### build

```js
handoff.build();
```

Build will take the exported artifacts and build a react documentation site from
those artifacts. The build html site will be exported to the `out` directory
in the current working root

This method will throw an error if the `exported` directory or the `tokens.json`
files do not exist

#### integration

```js
handoff.integration();
```

The integration method will run just the preview and integration generation.
This step is done as part of the build step, but its often useful to be able
to generate only the integration code.

### Hooks

Hooks allow a typescript or javascript app to interact with the pipeline.
This is especially useful for modifying or extending the output of the pipeline.
To use a hook in your project, once you've instantiated the handoff object, you
can call one of the hook methods and pass a function to the method. The hook
function will be called at the appropriate point in the pipeline.

For example if you want to alter the integration output, you can do this -

```js
import Handoff from 'handoff-app';

const handoff = new Handoff({
  // You can customize the configuration here
});

handoff.postIntegration((documentationObject: DocumentationObject, data: HookReturn[]) => {
  const colors = documentationObject.design.color.map((color) => {
    return {
      name: color.name,
      value: color.value,
    };
  });
  data.push({
    filename: 'colors.json',
    data: JSON.stringify(colors, null, 2),
  });
  return data;
});

handoff.fetch();
```

#### postIntegration
The Post integration hook will allow you to add a function that will be executed
after the integration build is complete. The function accepts two arguments - 

__arguments__ 
- `tokens: DocumentationObject` This is an instance of the exported 
DocumentationObject containing all of the tokens.
- `data: HookReturn[]` This an array of HookReturns, consisting of `filename` 
and `data`. Each object in this array will be written out to 
`exported/{integration}-tokens`

__return__ 
The hook must return an array of `HookReturn` objects, or an empty array

##### Example
```js
handoff.postIntegration((documentationObject: DocumentationObject, data: HookReturn[]) => {
  const colors = documentationObject.design.color.map((color) => {
    return {
      name: color.name,
      value: color.value,
    };
  });
  data.push({
    filename: 'colors.json',
    data: JSON.stringify(colors, null, 2),
  });
  return data;
});
```

#### postBuild
This function is called after the app build is complete. 

__arguments__ 
- `tokens: DocumentationObject` This is an instance of the exported 
DocumentationObject containing all of the tokens.

__returns__ 
Nothing is returned from the postBuild hook

#### postCssTransformer
This function is called after the css generation is complete. 

__arguments__ 
- `tokens: DocumentationObject` This is an instance of the exported 
DocumentationObject containing all of the tokens.
- `tokens: DocumentationObject` This is an instance of the exported 
DocumentationObject containing all of the tokens.

__returns__ 
