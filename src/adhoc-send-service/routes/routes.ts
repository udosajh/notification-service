import { AdhocNotificationController } from "./../controller/adhoc-notification-controller";
import * as express from "express";
import { EntitiesFactory } from "../../helper/entities-factory";
import { v4 } from "uuid";

const app = express.default();


app.use(express.json());
app.use(express.urlencoded( { extended: false } ));

const entitiesFactory = new EntitiesFactory();

function getReqId() {
    return v4();
}

app.post("/notification", async (req: express.Request, res: express.Response) => {
    const reqId = getReqId();
    const logger = entitiesFactory.getChildLogger(reqId);
    const errorHandler = entitiesFactory.createErrorHandler(logger);
    const notificationModel = await entitiesFactory.createNotificationModel();
    const sendNotificationService = entitiesFactory.createSendService(logger);
    const controller = new AdhocNotificationController(logger, errorHandler, notificationModel, sendNotificationService);
    await controller.sendNotification(req, res);
});