import { AllNotification, Notification, NotificationMediumType } from "../types/types";
import { WhatsappService } from "./whatsapp-send-service";
import * as bunyan from "bunyan";

export interface SendResponse {
    success: Notification[];
    failed: Notification[];
}


export class SendService {
    constructor(
        private whatsappService: WhatsappService,
        _slackService: SlackService,
        _smsService: SmsService,
        _logger: bunyan
        ) { }

    async sendNotifications(notifications: AllNotification[]): Promise<SendResponse> {
        const slackNotifications = notifications.filter(notification => notification.noitification_medium_type === NotificationMediumType.SLACK);
        const emailNotifications = notifications.filter(notification => notification.noitification_medium_type === NotificationMediumType.WHATSAPP);
        const whatsappNotifications = notifications.filter(notification => notification.noitification_medium_type === NotificationMediumType.SMS);
        const sendResult = await Promise.all([this.sendEmailNotification(emailNotifications), this.sendSlackNotification(slackNotifications), this.sendWhatsappNotification(whatsappNotifications)]);
        return {
            success: sendResult[0].success.concat(sendResult[1].success).concat(sendResult[2].success),
            failed: sendResult[0].failed.concat(sendResult[1].failed).concat(sendResult[2].failed)
        };
    }

    async sendWhatsappNotification(notifications: Notification[]): Promise<SendResponse> {
        if (notifications.length) {
            return await this.whatsappService.send(notifications);
        } else {
            return {
                success: [],
                failed: []
            };
        }
    }

    async sendSlackNotification(_notifications: Notification[]): Promise<SendResponse> {
        return {
            success: [],
            failed: []
        };
    }

    async sendEmailNotification(_notifications: Notification[]): Promise<SendResponse> {
        return {
            success: [],
            failed: []
        };
    }
}

export class SlackService {}
export class SmsService {}