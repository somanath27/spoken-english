// process.env['NODE_CONFIG_DIR'] = __dirname + '/configs';
import * as dotenv from 'dotenv';
dotenv.config();
import App from './app'
import router from './routes/router'
const app=  new App(router)

const server=app.listen();


// The purpose of this code is to handle unexpected errors
//  and ensure that the application tries to clean up resources (like closing the server) before exiting.
//  This is crucial for applications running in production environments to avoid leaving resources 
// in an inconsistent state. The use of process.exit(1) suggests that
//  the application is exiting with an error status.

// const exitHandler = (er: any) => {
//     console.log('exitHandler', er);
  
//     if (server) {
//       server.close(() => {
//         process.exit(1);
//       });
//     } else {
//       process.exit(1);
//     }
//   };
  
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const unexpectedErrorHandler = (error: any) => exitHandler(error);
  
//   process.on('uncaughtException', unexpectedErrorHandler);
//   process.on('unhandledRejection', unexpectedErrorHandler);