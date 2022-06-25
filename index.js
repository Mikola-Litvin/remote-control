import Jimp from 'jimp';
import {httpServer} from './src/http_server/index.js';
import robot from 'robotjs';
import { WebSocketServer } from 'ws';

const HTTP_PORT = 3000;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const ws = new WebSocketServer({port: 8080});
ws.on('connection', onConnect);

ws.on('close', () => console.log('WebSocket closed'));

function onConnect(client) {
  client.send(`Port=${ws.options.port}`);
  
  client.on('message', function(message) {
    const [ command, value, value2 ] = message.toString().split(' ');
    const { x, y } = robot.getMousePos();

    try {
      switch (command) {
        case 'mouse_position':
          client.send(`mouse_position {${x}px},{${y}px}`);
          break;
        case 'mouse_up':
          client.send('mouse_up\0');
          robot.moveMouse(x, y - Number(value));
          client.send('Move_mouse_up');
          break;
        case 'mouse_down':
          client.send('mouse_down\0');
          robot.moveMouse(x, y + Number(value));
          client.send('Move_mouse_down');
          break;
        case 'mouse_left':
          client.send('mouse_left\0');
          robot.moveMouse(x - Number(value), y);
          client.send('Move_mouse_left');
          break;
        case 'mouse_right':
          client.send('mouse_right\0');
          robot.moveMouse(x + Number(value), y);
          client.send('Move_mouse_right');
          break;
        case 'draw_circle':
          client.send('draw_circle\0');
          
          for (let i = 0; i <= Math.PI * 2; i += 0.03) {
            const X = x - (Number(value) * Math.cos(i));
            const Y = y - (Number(value) * Math.sin(i));
            
            robot.dragMouse(X + Number(value), Y);
          }

          client.send('Circle_has_been_drawn');

          break;
        case 'draw_square':
          client.send('draw_square\0');
          for (let i = 0; i <= Number(value); i += 1) {
            robot.dragMouse(x + i, y);
          }

          for (let i = 0; i <= Number(value); i += 1) {
            robot.dragMouse(x + Number(value), y + i);
          }

          for (let i = 0; i <= Number(value); i += 1) {
            robot.dragMouse((x + Number(value)) - i, y + Number(value));
          }

          for (let i = 0; i <= Number(value); i += 1) {
            robot.dragMouse(x, y + Number(value) - i);
          }

          client.send('Square_has_been_drawn');

          break;
        case 'draw_rectangle':
          client.send('draw_rectangle\0');
          for (let i = 0; i <= Number(value); i += 1) {
            robot.dragMouse(x + i, y);
          }

          for (let i = 0; i <= Number(value2); i += 1) {
            robot.dragMouse(x + Number(value), y + i);
          }

          for (let i = 0; i <= Number(value); i += 1) {
            robot.dragMouse((x + Number(value)) - i, y + Number(value2));
          }

          for (let i = 0; i <= Number(value2); i += 1) {
            robot.dragMouse(x, y + Number(value2) - i);
          }

          client.send('Rectangle_has_been_drawn');

          break;
        case 'prnt_scrn':
          const tempImage = new Jimp(200, 200);
          tempImage.bitmap.data = robot.screen.capture(x - 100, y - 100, 200, 200).image;
          tempImage.getBase64Async(Jimp.MIME_PNG).then(data => {
            const arr = data.split(',');
            client.send(`prnt_scrn ${arr[1]}`)
            client.send(`Print_screen`)
          });

          break;
        default:
          console.log('Неизвестная команда');
          break;
      }
    } catch (error) {
      console.log('Error', error);
    }
  });

  client.on('close', function() {
    ws.close();
  });
}
