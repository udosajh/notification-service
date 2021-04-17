import * as joi from "joi";
import { ValidationError } from "../controller/exceptions";
import { AdhocNotificationReq, NotificationMediumType } from "./../../types/types";
import * as bunyan from "bunyan";

const AdhocNotificationReqSchema = joi.object<AdhocNotificationReq>({
    user_id: joi.string().required(),
    msg: joi.string().required(),
    noitification_medium_type: joi.string().valid(Object.values(NotificationMediumType)).required()
});


export async function validate(reqBody: AdhocNotificationReq, logger: bunyan) {
    try {
        logger.info("validating adhoc send notification req body");
        await AdhocNotificationReqSchema.validateAsync(reqBody);
        logger.info("adhoc request validated successfully");
    } catch (err) {
        logger.error({ err }, "validation error occurred");
        throw new ValidationError(err.details[0].message);
    }
}