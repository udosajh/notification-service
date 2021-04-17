import * as process from "process";

const PROD_ENV = "production";

export function isProd() {
    return process.env.NODE_ENV === PROD_ENV;
}