import { IConnection, InitializeParams } from 'vscode-languageserver';

/**
 * TODO
 * 
 * @export
 * @interface Initializable
 */
export interface Initializable {
    /**
     * TODO
     * 
     * @param {IConnection} connection
     * @param {InitializeParams} params
     * 
     * @memberOf Initializable
     */
    initialize(connection: IConnection, params: InitializeParams): void;

    /**
     * TODO
     * 
     * @memberOf Initializable
     */
    initialized(): void;
}
