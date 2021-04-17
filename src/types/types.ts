
export enum MessageStatus {
    QUEUED = "QUEUED",
    FAILED = "FAILED",
    SENT = "SENT",
    AVAILABLE = "AVAILABLE"
}

export enum NotificationInterval {
    EVERY_WEEK = "EVERY_WEEK",
    EVERY_DAY = "EVERY_DAY",
    EVERY_MONTH = "EVERY_MONTH",
    EVERY_YEAR = "EVERY_YEAR"
}

export enum NotificationStatus {
    SUBSCRIBED = "SUBSCRIBED",
    UNSUBSCRIBED = "UNSUBSCRIBED"
}

export enum NotificationMediumType {
    SMS = "SMS",
    SLACK = "SLACK",
    WHATSAPP = "WHATSAPP"
}

export interface Notification {
    id: string;
    user_id: string;
    msg_status: MessageStatus;
    error_message: string;
    queued_time: number;
    last_sent: number;
    created_at: number;
    updated_at: number;
    interval: NotificationInterval;
    status: NotificationStatus;
    msg: string;
}

export interface SmsNotification extends Notification {
    notification_medium: {
        [NotificationMediumType.SMS]: {
            mob_no: string;
        }
    };
    noitification_medium_type: NotificationMediumType.SMS;
}

export interface WhatsappNotification extends Notification {
    notification_medium: {
        [NotificationMediumType.WHATSAPP]: {
            mob_no: string;
        }
    };
    noitification_medium_type: NotificationMediumType.WHATSAPP;
}

export interface SlackNotification extends Notification {
    notification_medium: {
        [NotificationMediumType.SLACK]: {
            webhook: string;
        }
    };
    noitification_medium_type: NotificationMediumType.SLACK;
}

export interface AdhocNotificationReq {
    user_id: string;
    msg: string;
    noitification_medium_type: NotificationMediumType;
}

export type AllNotification = WhatsappNotification | SlackNotification | SmsNotification;