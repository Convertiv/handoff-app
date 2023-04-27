/**
 *
 * @param {*} documentationObject
 * @returns
 */
var postIntegration = (documentationObject) => {
  const colors = {}, type = {};
  documentationObject.design.color.map((color) => {
    colors[color.machineName] = color.value;
  });
  documentationObject.design.typography.map((type) => {
    type[type.machine_name] = [type.machine_name, 'san-serif'];
  });
  const data = {
    content: ['./src/**/*.{html,js}'],
    theme: {
      colors
    },
  };
  console.log(JSON.stringify(data))
  return data;
};

var init = () => {
  console.log("Init from plugin")
}
