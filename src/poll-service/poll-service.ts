import { MessageStatus, NotificationStatus, NotificationInterval, NotificationMediumType } from "./../types/types";
import * as bunyan from "bunyan";
import { NotificationModel } from "../model/notification-model";
import { SendService } from "./../send-service/send-service";
import delay from "delay";


export class PollService {
    constructor(private logger: bunyan, private modelClient: NotificationModel, private sendService: SendService) { }
    // 1 hour in milli second
    private static readonly POLL_AVAILABLE_MSGS_INTERVAL = 1 * 60 * 60 * 1000;
    // 1 hour in milli second
    private static readonly POLL_QUEUED_MSGS_INTERVAL = 1 * 60 * 60 * 1000;
    // 1 hour in milli second
    private static readonly POLL_EVERY_WEEK_MSGS_INTERVAL = 1 * 60 * 60 * 1000;

    timestampInSecond() {
        return Math.round(Date.now() / 1000);
    }

    timestamp() {
        return Date.now();
    }

    /**
     *
     * @param duration in ms
     */
    async delay(duration: number) {
        await delay(duration);
    }

    /**
     * poll available messages to send
     * @todo add exponential backoff logic to avoid continuosly polling when error occurs
     *
     */
    async pollAvailableMsgs(notificationMedium: NotificationMediumType) {
        while (true) {
            try {
                this.logger.info("polling available messages");
                const { docs: notifications } = await this.modelClient.getNotificationsUsingMsgStatus(NotificationStatus.SUBSCRIBED, MessageStatus.AVAILABLE, notificationMedium);
                this.logger.info("notifications fetched successfully");
                const response = await this.sendService.sendNotifications(notifications);
                const successfullNots = response.success.map(notification => {
                    notification.error_message = "";
                    notification.last_sent = this.timestampInSecond();
                    notification.msg_status = MessageStatus.SENT;
                    notification.updated_at = this.timestamp();
                    return notification;
                });
                const failedNots = response.failed.map((notification) => {
                    notification.msg_status = MessageStatus.FAILED;
                    notification.updated_at = this.timestamp();
                    return notification;
                });
                const nots = successfullNots.concat(failedNots);
                await this.modelClient.updateNots(nots);
                await this.delay(PollService.POLL_AVAILABLE_MSGS_INTERVAL);
            } catch (err) {
                this.logger.error({ err }, "error occurred while sending notifications");
            }
        }
    }

    async pollQueuedMessages(notificationMedium: NotificationMediumType) {
        while (true) {
            try {
                this.logger.info("polling queued messages");
                await this.modelClient.updQueuedMessagesExceedsDuration(notificationMedium);
                await this.delay(PollService.POLL_QUEUED_MSGS_INTERVAL);
            } catch (err) {
                this.logger.info({ err }, "error occurred while polling queued messages");
            }
        }
    }

    /**
     * @todo add alarm raised logic (similar to (queued, sent) logic ), exponential backoff when error occurs
     */
    async pollFailedMessages(notificationMedium: NotificationMediumType) {
        while (true) {
            try {
                this.logger.info("polling failed messages");
                const notificationStatus = NotificationStatus.SUBSCRIBED;
                const messageStatus = MessageStatus.FAILED;
                const _failedDocs = await this.modelClient.getNotificationsUsingMsgStatus(notificationStatus, messageStatus, notificationMedium);
                this.logger.error({ failedNotifications: _failedDocs.docs.map(not => { return { user_id: not.user_id, statusType: not.noitification_medium_type }; }) }, "");
                // raise alarm logic
                await this.delay(PollService.POLL_QUEUED_MSGS_INTERVAL);
            } catch (err) {
                this.logger.info({ err }, "error occurred while polling failed messages");
            }
        }
    }

    async pollSentMessages(notificationMedium: NotificationMediumType) {
        await this.pollEveryDayMsgs(notificationMedium);
        await this.pollEveryWeekMsgs(notificationMedium);
        await this.pollEveryYearMsgs(notificationMedium);
    }

    /**
     * @todo add exponential backoff logic, raise panic alarm on repeated errors
     */
    async pollEveryWeekMsgs(notificationMedium: NotificationMediumType) {
        while (true) {
            try {
                this.logger.info("polling every week send messages");
                const dayInSec = 7 * 24 * 60 * 60;
                const lastSentTime = this.timestampInSecond() - dayInSec;
                await this.modelClient.updateSentToAvailable(NotificationInterval.EVERY_WEEK, lastSentTime, notificationMedium);
                await this.delay(PollService.POLL_EVERY_WEEK_MSGS_INTERVAL);
            } catch (err) {
                this.logger.error({ err }, "error occured while toggling weekly notifications");
            }
        }
    }

    /**
     * similar logic as shown in pollEveryWeekMsgs
     */
    async pollEveryDayMsgs(_notificationMedium: NotificationMediumType) { }
    async pollEveryYearMsgs(_notificationMedium: NotificationMediumType) { }
    async pollEveryMonthMsgs(_notificationMedium: NotificationMediumType) { }

}