import Flutterwave from 'flutterwave-node-v3';

interface PayloadOptions {
  preauthorize: boolean;
  cardNumber: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardCvv: string;
  email: string;
  amount: string;
  currency: string;
  fullName: string;
  txRef: string;
  encKey?: string;
  redirect_url: string;
}
export class PaymentWrapper {
  private _gateway?: any;
  private _encKey?: string;
  get gateway() {
    if (!this._gateway) {
      throw new Error('No payment gateway has been initailized');
    }
    return this._gateway;
  }
  get encKey() {
    if (!this._encKey) {
      throw new Error('No payment gateway has been initailized');
    }
    return this._encKey;
  }
  initialize(publicKey: string, secretKey: string, encKey: string) {
    this._gateway = new Flutterwave(publicKey, secretKey);
    this._encKey = encKey;
  }

  buildPayload(options: PayloadOptions) {
    const payload = {
      preauthorize: options.preauthorize,
      card_number: options.cardNumber,
      cvv: options.cardCvv,
      expiry_month: options.cardExpiryMonth,
      expiry_year: options.cardExpiryYear,
      currency: options.currency,
      amount: options.amount,
      fullname: options.fullName,
      email: options.email,
      enckey: this.encKey,
      tx_ref: options.txRef,
      redirect_url: options.redirect_url,
    };

    return payload;
  }
  async chargeCard(payload: object) {
    try {
      const response = await this.gateway.Charge.card(payload);

      return response;
    } catch (err) {
      throw err;
    }
  }

  async chargeWithPinValidateOtp(flwRef: any, flutterwaveOTP: string) {
    try {
      const callValidate = await this.gateway.Charge.validate({
        otp: flutterwaveOTP,
        flw_ref: flwRef,
      });
      return callValidate;
    } catch (err) {
      throw err;
    }
  }
  async verifyTransaction(
    id: string
  ): Promise<{ status: 'successful' | 'pending' | string; token: string }> {
    try {
      const transaction = await this.gateway.Transaction.verify({ id });
      if (!transaction) {
        throw new Error('Transaction does not exist');
      }
      return {
        status: transaction.data.status,
        token: transaction.data.card.token,
      };
    } catch (err) {
      throw err;
    }
  }
}
export const paymentWrapper = new PaymentWrapper();
