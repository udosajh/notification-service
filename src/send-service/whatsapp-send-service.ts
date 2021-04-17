import { Notification } from "./../types/types";
import asyncRetry from "async-retry";

export class RetryService {
    constructor(private client: any) {}

    async retryMsg(notification: Notification) {
        return await asyncRetry(async (_bail) => {
            await this.client.send(notification);
        }, {
            retries: 2
        });
    }
}


export class WhatsappService extends RetryService {
    constructor(client: any) {
        super(client);
    }

    async send(notifications: Notification[]) {
        const response$ = notifications.map(notification => (this.retryMsg(notification) as Promise<any>)
            .catch(err => { return { err, errorOccurredWhileSending: true }; }));
        const response = await Promise.all(response$);
        const failedNots = notifications.filter((notification: Notification, index) => {
            if (response[index].hasOwnProperty("errorOccurredWhileSending")) {
                notification.error_message = response[index].err.message;
                return true;
            }
            return false;
        });
        const successfullySentNots = notifications.filter((_notification: Notification, index) => {
            if (!response[index].hasOwnProperty("errorOccurredWhileSending")) {
                return true;
            }
            return false;
        });

        return {
            success: successfullySentNots,
            failed: failedNots
        };
    }


}