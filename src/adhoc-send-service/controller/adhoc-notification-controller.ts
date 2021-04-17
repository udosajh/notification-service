import { Request, Response } from "express";
import { ErrorHandler } from "./error-handler";
import * as bunyan from "bunyan";
import { NotificationModel } from "./../../model/notification-model";
import { validate } from "../validator/validator";
import { AdhocNotificationReq, AllNotification } from "./../../types/types";
import { SendService } from "./../../send-service/send-service";

export class AdhocNotificationController {
    constructor(private logger: bunyan, private errorHandler: ErrorHandler, private notificationModel: NotificationModel, private sendService: SendService) {}

    async sendNotification(req: Request, res: Response) {
        try {
            this.logger.info({ req }, "sending adhoc notification");
            const adhocNotReq: AdhocNotificationReq = req.body;
            await validate(adhocNotReq, this.logger);
            // @todo remove any, add mongo query
            const userDetail: AllNotification = await this.notificationModel.getUserDetails(adhocNotReq.user_id, adhocNotReq.noitification_medium_type) as any;
            const sendResponse = await this.sendService.sendNotifications([userDetail]);
            if (sendResponse.failed.length) {
                throw new Error(sendResponse.failed[0].error_message);
            }
            res.send("Message Sent");
        } catch (err) {
            this.errorHandler.handleErrors(res, err);
        }
    }
}
