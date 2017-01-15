import { Observable, Subject } from 'rxjs/Rx';
import { Notification } from 'typescript-hero-common/notifications';
import { IConnection } from 'vscode-languageserver/lib/main';

export class ServerMessageBus {
    private notificationHandler: { [id: string]: Subject<Notification> } = {};

    public get endpoint(): IConnection {
        return this.connection;
    }

    constructor(private connection: IConnection) {
    }

    /**
     * TODO
     * 
     * @template TNotification
     * @param {string} identifier
     * @returns {Observable<TNotification>}
     * 
     * @memberOf ServerMessageBus
     */
    public registerNotificationHandler(identifier: string): Observable<Notification> {
        if (!this.notificationHandler[identifier]) {
            this.notificationHandler[identifier] = new Subject<Notification>();
            this.endpoint.onRequest(identifier, (...args: any[]) => {
                this.notificationHandler[identifier].next({ identifier, args });
            });
        }
        return this.notificationHandler[identifier];
    }
}
