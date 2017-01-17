import 'reflect-metadata';
import { Logger } from './utilities/Logger';
import { Initializable } from './Initializable';
import { Container } from './IoC';
import { createConnection, IConnection, IPCMessageReader, IPCMessageWriter, MessageType } from 'vscode-languageserver';

const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
connection.listen();

const parts = Container.getAll<Initializable>('ServerParts');

connection.onInitialize(params => {
    parts.forEach(o => o.initialize(connection, params));
    return {
        capabilities: {}
    };
});

connection.onInitialized(() => parts.forEach(o => o.initialized()));

// connection.onInitialize((params): InitializeResult => {
//     console.log(params);
//     return {
//         capabilities: {
//         }
//     };
// });

// connection.onInitialized(() => {
//     connection.sendNotification('window/logMessage', {
//         type: MessageType.Log,
//         message: 'Hello world from the server'
//     });

//     (<Logger>parts[0]).info('FOOOOOBAR!');
// });

// let bus = ;

// bus.registerNotificationHandler('foobar').subscribe(foobar => {
//     console.log(foobar);
//     bus.endpoint.sendNotification('window/logMessage', <LogMessageParams>{
//         type: MessageType.Log,
//         message: 'Received foobar notification!'
//     });
// });





