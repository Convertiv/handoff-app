// TODO: Figure out how to read the root 
// config even though preconstruct doesn't want to
export const getConfig = async () => {
  return {
    components: {
      alert: 'Alert',
      button: 'Button',
      checkbox: 'Checkbox',
      input: 'Input',
      modal: 'Modal',
      pagination: null,
      radio: 'Radio',
      select: 'Select',
      switch: 'Switch',
      tooltip: 'Tooltip',
    },
  };
};
