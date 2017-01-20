import { ServerConnection } from './ServerConnection';
import { InitializeParams } from 'vscode-languageserver';

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
     * @param {ServerConnection} connection
     * @param {InitializeParams} params
     * 
     * @memberOf Initializable
     */
    initialize(connection: ServerConnection, params: InitializeParams): void;
}
