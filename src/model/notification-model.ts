import { AllNotification, NotificationMediumType } from "./../types/types";
import { Db, FilterQuery, MongoClient } from "mongodb";
import { NotificationStatus, MessageStatus, NotificationInterval, Notification } from "../types/types";

export class NotificationModel {
    private dbClient: Db;

    constructor(private mongoClient: MongoClient, dbName: string) {
        this.dbClient = this.getDbClient(dbName);
    }

    private static readonly DOCS_LIMIT = 500;
    // 15 min in mill seconds
    private static readonly ALLOWED_QUEUED_DURATION = 15 * 60 * 1000;

    getTimestamp() {
        return Date.now();
    }

    getDbClient(dbName: string) {
        return this.mongoClient.db(dbName);
    }

    /**
     * @todo add pagination logic, setup index on fields -> status, message_status
     * fetches notification with the given notification status and message status
     */
    async getNotificationsUsingMsgStatus(notificationStatus: NotificationStatus, messageStatus: MessageStatus, collectionName: string) {
        const collection = await this.dbClient.collection<AllNotification>(collectionName);
        const findParams: FilterQuery<AllNotification> = {
            status: notificationStatus,
            msg_status: messageStatus
        };
        const docs = await collection.find(findParams).limit(NotificationModel.DOCS_LIMIT).toArray();
        return {
            docs: docs
        };
    }

    /**
     * @param lastSent timestamp (in seconds) when the notification was last sent, fetch the doc using condition => notification.last_sent < lastSent
     * change available status to queued and return the updated document
     * @todo possible bottleneck because of single fetch and update
     */
    async toggleAvailableNotification(interval: NotificationInterval, lastSent: number, collectionName: string) {
        const notificationStatus = NotificationStatus.SUBSCRIBED;
        const messageStatus = MessageStatus.AVAILABLE;
        const timestamp = this.getTimestamp();
        const collection = await this.dbClient.collection<AllNotification>(collectionName);
        const findAndUpdParams: FilterQuery<AllNotification> = {
            status: notificationStatus,
            msg_status: messageStatus,
            interval: interval,
            last_sent: { "$lt": lastSent }
        };
        const doc = await collection.findOneAndUpdate(findAndUpdParams, { $set: { msg_status: MessageStatus.QUEUED, queued_time: timestamp } });
        return {
            doc: doc
        };
    }

    /**
     * queued messages heartbeat monitor
     * checks if notification in queued status exceeds the queued allowed duration, if it exceeds it reverts its status to AVAILABLE
     */
    async updQueuedMessagesExceedsDuration(collectionName: string) {
        const notificationStatus = NotificationStatus.SUBSCRIBED;
        const messageStatus = MessageStatus.QUEUED;
        const timestamp = this.getTimestamp();
        const updateParams = {
            status: notificationStatus,
            msg_status: messageStatus,
            queued_time: { "$lt": timestamp - NotificationModel.ALLOWED_QUEUED_DURATION }
        };
        const collection = await this.dbClient.collection<Notification>(collectionName);
        await collection.updateMany(updateParams, { $set: { msg_status: MessageStatus.AVAILABLE, updated_at: this.getTimestamp() } });
    }

    /**
     * update notifications
     */
    async updateNots(_notifications: Notification[]) { }

    /**
     * index on notificationStatus, msgStatus, notificationInterval, last_sent
     * @param interval notification interval
     * @param lastSentTime notification last sent
     */
    async updateSentToAvailable(interval: NotificationInterval, lastSentTime: number, collectionName: string) {
        const collection = await this.dbClient.collection<Notification>(collectionName);
        const updateParams = {
            status: NotificationStatus.SUBSCRIBED,
            msg_status: MessageStatus.SENT,
            interval,
            last_sent: { "$lt": lastSentTime }
        };
        await collection.updateMany(updateParams, { $set: { msg_status: MessageStatus.AVAILABLE, updated_at: this.getTimestamp() } });
    }

    /**
     *
     * @param userId user id
     * @param notification_medium notification medium type equivalent to collection name
     * @returns info required to send notification
     */
    async getUserDetails(_userId: string, _notification_medium: NotificationMediumType) {
        return {};
    }


}