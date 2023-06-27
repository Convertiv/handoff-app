const buttonRender = require("./tailwind/button");

const createComponentMap = (components) => {
    const componentMap = {
        ...buttonRender(components.buttons)
    };
    return componentMap;
};

module.exports = createComponentMap;