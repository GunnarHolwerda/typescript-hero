import 'reflect-metadata';
import { Initializable } from './Initializable';
import { Container } from './IoC';
import { createConnection, IConnection, IPCMessageReader, IPCMessageWriter } from 'vscode-languageserver';

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
