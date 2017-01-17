import { IConnection, InitializeParams } from 'vscode-languageserver';

/**
 * Interface for an initializable part of the server.
 * 
 * @export
 * @interface Initializable
 */
export interface Initializable {
    /**
     * Method that should be called by the main entry point of the server. Initializes the given part
     * with the connection and the init params.
     * 
     * @param {IConnection} connection
     * @param {InitializeParams} params
     * 
     * @memberOf Initializable
     */
    initialize(connection: IConnection, params: InitializeParams): void;

    /**
     * Method that should be called by the main entry point of the server when the initialization is done.
     * (Actually this is a client -> server message when the client is initialized and ready for
     * messages.)
     * 
     * @memberOf Initializable
     */
    initialized(): void;
}
