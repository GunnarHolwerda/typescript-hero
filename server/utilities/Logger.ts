import { Initializable } from '../Initializable';
import { injectable } from 'inversify';
import { IConnection, InitializeParams } from 'vscode-languageserver';

@injectable()
export class Logger implements Initializable {
    
    constructor() { }

    /**
     * TODO
     * 
     * @param {IConnection} connection
     * @param {InitializeParams} params
     * 
     * @memberOf Logger
     */
    public initialize(connection: IConnection, params: InitializeParams): void {
        connection.onDidChangeConfiguration(settings => {
            console.log(settings);
        });
    }

    /**
     * TODO
     * 
     * @memberOf Logger
     */
    public initialized(): void {
        console.log('start with stuff?');
    }
}
