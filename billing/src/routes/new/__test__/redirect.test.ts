import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../../app';
import { natsWrapper } from '../../../nats-wrapper';
import { Billing } from '../../../models/billing';
jest.setTimeout(60000);

const REDIRECT_TEST_PATH =
  '/api/billing/redirect?response=%7B"id"%3A3397020%2C"txRef"%3A"2022-05-21T03%3A21%3A12.856ZFLWSECK_TESTf30980bab378"%2C"orderRef"%3A"URF_1653103274579_4386935"%2C"flwRef"%3A"FLW-MOCK-39e3caee9f505dbceea0bfba2b1231c7"%2C"redirectUrl"%3A"http%3A%2F%2F127.0.0.1%3A46865%2Fapi%2Fbilling%2Fredirect"%2C"device_fingerprint"%3A"N%2FA"%2C"settlement_token"%3Anull%2C"cycle"%3A"one-time"%2C"amount"%3A1%2C"charged_amount"%3A1%2C"appfee"%3A0.04%2C"merchantfee"%3A0%2C"merchantbearsfee"%3A1%2C"chargeResponseCode"%3A"00"%2C"raveRef"%3A"RV316531032745785DF8C05357"%2C"chargeResponseMessage"%3A"Please+enter+the+OTP+sent+to+your+mobile+number+080******+and+email+te**%40rave**.com"%2C"authModelUsed"%3A"VBVSECURECODE"%2C"currency"%3A"USD"%2C"IP"%3A"52.209.154.143"%2C"narration"%3A"CARD+Transaction+"%2C"status"%3A"successful"%2C"modalauditid"%3A"ea4d8e60930d0b30b3f1154dc2a3b199"%2C"vbvrespmessage"%3A"Approved.+Successful"%2C"authurl"%3A"https%3A%2F%2Fravesandboxapi.flutterwave.com%2Fmockvbvpage%3Fref%3DFLW-MOCK-39e3caee9f505dbceea0bfba2b1231c7%26code%3D00%26message%3DApproved.+Successful%26receiptno%3DRN1653103274894"%2C"vbvrespcode"%3A"00"%2C"acctvalrespmsg"%3Anull%2C"acctvalrespcode"%3A"RN1653103274894"%2C"paymentType"%3A"card"%2C"paymentPlan"%3Anull%2C"paymentPage"%3Anull%2C"paymentId"%3A"6528749"%2C"fraud_status"%3A"ok"%2C"charge_type"%3A"normal"%2C"is_live"%3A0%2C"retry_attempt"%3Anull%2C"getpaidBatchId"%3Anull%2C"createdAt"%3A"2022-05-21T03%3A21%3A14.000Z"%2C"updatedAt"%3A"2022-05-21T03%3A22%3A02.000Z"%2C"deletedAt"%3Anull%2C"customerId"%3A1632151%2C"AccountId"%3A1747229%2C"customer"%3A%7B"id"%3A1632151%2C"phone"%3Anull%2C"fullName"%3A"Felix+Philips"%2C"customertoken"%3Anull%2C"email"%3A"devfelixphil%40gmail.com"%2C"createdAt"%3A"2022-05-21T03%3A21%3A14.000Z"%2C"updatedAt"%3A"2022-05-21T03%3A21%3A14.000Z"%2C"deletedAt"%3Anull%2C"AccountId"%3A1747229%7D%2C"chargeToken"%3A%7B"user_token"%3A"b90f1"%2C"embed_token"%3A"flw-t0-7631ef425a34a0c20a32952f659089c1-m03k"%7D%2C"airtime_flag"%3Afalse%7D';

it('responds with payment success', async () => {
  // Fake transactionId in DB
  const billing = Billing.build({
    userId: new mongoose.Types.ObjectId().toHexString(),
    cardNumber: '5438898014560229',
    cardExpiryMonth: '10',
    cardExpiryYear: '31',
    cardFullName: 'Felix Philips',
    transactionId: '3397020',
    txRef: '2022-05-21T03:21:12.856ZFLWSECK_TESTf30980bab378',
  });
  await billing.save();
  const response = await request(app)
    .post(REDIRECT_TEST_PATH)
    .send({})
    .expect(200);
  expect(response.headers.location).toEqual(
    '127.0.0.1/payment/?result=success'
  );
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
