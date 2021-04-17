import { NotificationMediumType } from "./../types/types";
import { EntitiesFactory } from "./../helper/entities-factory";

const entitiesFactory = new EntitiesFactory();
const logger = EntitiesFactory.createLogger();

async function start() {
    const pollService = await entitiesFactory.createPollService();
    Object.values(NotificationMediumType).forEach((notificationMedium => {
        pollService.pollAvailableMsgs(notificationMedium);
        pollService.pollFailedMessages(notificationMedium);
        pollService.pollQueuedMessages(notificationMedium);
        pollService.pollSentMessages(notificationMedium);
    }));
}

start()
    .catch(err => {
        logger.error({ err }, "error occurred");
    });