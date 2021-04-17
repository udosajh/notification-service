import * as bunyan from "bunyan";
import { Response } from "express";
import * as httpStatus from "http-status";
import { isProd } from "./../../helper/env-checker";
import { ValidationError } from "./exceptions";

export class ErrorHandler {
    constructor(private logger: bunyan) {}

    private static readonly INTERNAL_SERVER_ERROR_MSG = "Ooops something went wrong! please try again after some time";

    handleErrors(res: Response, err: any) {
        if (err instanceof ValidationError) {
            res.status(httpStatus.BAD_REQUEST).send(err.message);
        } else {
            if (isProd()) {
                res.status(httpStatus.INTERNAL_SERVER_ERROR).send(ErrorHandler.INTERNAL_SERVER_ERROR_MSG);
            } else {
                res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err.message);
            }
            this.logger.error({ err }, "internal server error occurred");
        }
    }
}