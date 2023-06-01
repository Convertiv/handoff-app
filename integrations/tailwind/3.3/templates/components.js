const buttonRender = require("./tailwind/button");

const createComponentMap = (components) => {
    const componentMap = {
        ...buttonRender(components.buttons)
    };
    console.log(componentMap)
    return componentMap;
};

module.exports = createComponentMap;