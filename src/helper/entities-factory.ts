import { PollService } from "./../poll-service/poll-service";
import { SERVICE_NAME } from "./constants";
import { Db, MongoClient } from "mongodb";
import * as bunyan from "bunyan";
import { ErrorHandler } from "./../adhoc-send-service/controller/error-handler";
import { NotificationModel } from "./../model/notification-model";
import { SendService, SlackService, SmsService } from "./../send-service/send-service";
import { WhatsappService } from "./../send-service/whatsapp-send-service";

export class EntitiesFactory {
    constructor() { }
    private static modelClient: MongoClient;
    private static readonly DB_URL = "mongodb://localhost:27017";
    private static logger: bunyan;
    private static notificationDb: Db;
    private static DB_NAME: string;

    static getMongoClient() {
        return MongoClient;
    }

    static async createModelClient(): Promise<MongoClient | never> {
        if (EntitiesFactory.notificationDb) {
            return EntitiesFactory.modelClient;
        } else {
            const dbConfig = EntitiesFactory.fetchDbConfigs();
            EntitiesFactory.DB_NAME = dbConfig.dbName;
            const mongoClient = EntitiesFactory.getMongoClient();
            EntitiesFactory.modelClient = await mongoClient.connect(dbConfig.url, { useNewUrlParser: true });
            return EntitiesFactory.modelClient;
        }
    }

    static createLogger() {
        if (EntitiesFactory.logger) {
            return EntitiesFactory.logger;
        } else {
            EntitiesFactory.logger = bunyan.createLogger({ name: SERVICE_NAME, serializers: bunyan.stdSerializers });
            return EntitiesFactory.logger;
        }
    }

    getChildLogger(reqId: string) {
        EntitiesFactory.createLogger();
        return EntitiesFactory.logger.child({ reqId });
    }

    static fetchDbConfigs() {
        return { url: EntitiesFactory.DB_URL, dbName: "NotificationDb" };
    }

    async createNotificationModel() {
        const mongoClient = await EntitiesFactory.createModelClient();
        return new NotificationModel(mongoClient, EntitiesFactory.DB_NAME);
    }

    createErrorHandler(logger: bunyan) {
        return new ErrorHandler(logger);
    }

    createWhatsappService() {
        return new WhatsappService({});
    }

    createSmsService() {
        return new SmsService();
    }

    createSlackService() {
        return new SlackService();
    }

    createSendService(logger: bunyan) {
        const whatsappService = this.createWhatsappService();
        const smsService = this.createSmsService();
        const slackService = this.createSlackService();
        return new SendService(whatsappService, slackService, smsService, logger);
    }

    async createPollService() {
        const logger = EntitiesFactory.createLogger();
        const modelClient = await this.createNotificationModel();
        const sendService = this.createSendService(logger);
        return new PollService(logger, modelClient, sendService);
    }
}