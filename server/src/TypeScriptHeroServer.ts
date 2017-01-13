import {
    createConnection,
    IConnection,
    InitializeResult,
    IPCMessageReader,
    IPCMessageWriter
} from 'vscode-languageserver';


const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
    workspaceRoot = params.rootPath;
    console.log('initialization result.');
    return {
        capabilities: {
        }
    }
});

connection.listen();
