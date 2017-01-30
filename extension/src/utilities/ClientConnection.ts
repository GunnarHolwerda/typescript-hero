import { Observable, Subject } from 'rxjs';
import { GenericRequestHandler } from 'vscode-jsonrpc';
import { LanguageClient } from 'vscode-languageclient';

/**
 * TODO
 * 
 * @export
 * @class ClientConnection
 */
export class ClientConnection {
    private handler: { [id: string]: Subject<any> } = {};

    constructor(private endpoint: LanguageClient) { }

    /**
     * TODO
     * 
     * @param {string} method
     * @param {...any[]} args
     * 
     * @memberOf ClientConnection
     */
    public sendNotification(method: string, ...args: any[]): void {
        this.endpoint.sendNotification(method, args);
    }

    /**
     * TODO
     * 
     * @template T
     * @param {string} method
     * @param {*} [params]
     * @returns {Thenable<T>}
     * 
     * @memberOf ClientConnection
     */
    public sendRequest<T>(method: string, params?: any): Thenable<T> {
        return this.endpoint.sendRequest(method, params);
    }

    /**
     * TODO
     * 
     * @template T
     * @param {string} method
     * @returns {Observable<T>}
     * 
     * @memberOf ClientConnection
     */
    public onNotification<T>(method: string): Observable<T> {
        if (!this.handler[method]) {
            this.handler[method] = new Subject<T>();
            this.endpoint.onNotification(method, param => this.handler[method].next(param));
        }
        return this.handler[method];
    }

    /**
     * TODO
     * 
     * @template TResult
     * @template TError
     * @param {string} method
     * @param {GenericRequestHandler<TResult, TError>} handler
     * 
     * @memberOf ClientConnection
     */
    public onRequest<TResult, TError>(
        method: string,
        handler: GenericRequestHandler<TResult, TError>
    ): void {
        this.endpoint.onRequest(method, handler);
    }
}
