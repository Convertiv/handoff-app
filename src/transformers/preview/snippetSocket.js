const bindListener = () => {
  const ws = new WebSocket('ws://localhost:8080');

  ws.onopen = function (event) {
    console.log('WebSocket connection opened');
    ws.send('Hello from client!');
  };

  ws.onmessage = function (event) {
    console.log('Received message:', event.data);
  };
};
export default bindListener;