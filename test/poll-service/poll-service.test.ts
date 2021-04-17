import "mocha";
import { assert } from "chai";
import * as sinon from "sinon";
import * as bunyan from "bunyan";
import { SendService, SlackService, SmsService } from "./../../src/send-service/send-service";
import { WhatsappService } from "./../../src/send-service/whatsapp-send-service";

describe("test send service", () => {
    const sandbox = sinon.createSandbox();
    const logger = bunyan.createLogger({ name: "send service" });
    const client = { send: () => { } };
    const whatsappService = new WhatsappService(client);
    const smsService = new SmsService();
    const slackService = new SlackService();
    const sendService = new SendService(whatsappService, slackService, smsService, logger);
    beforeEach(() => sandbox.restore());

    it("send whatsapp notification", async () => {
        const nots: any = [{ data: "fake_data" }];
        const expectedResponse = { success: nots, failed: [] };
        const whatsappStub = sandbox.stub(whatsappService, "send").resolves({ success: [{ data: "fake_data" }] as any, failed: [] });
        const actualResponse = await sendService.sendWhatsappNotification(nots);
        assert.deepEqual(whatsappStub.getCall(0).args, [nots]);
        assert.deepEqual(actualResponse, expectedResponse);
    });
});