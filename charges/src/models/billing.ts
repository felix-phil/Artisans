import mongoose from 'mongoose';

interface BillingAttrs {
  id: string;
  userId: string;
  cardFullName: string;
  cardNumber: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardToken: string;
}

interface BillingDoc extends mongoose.Document {
  userId: string;
  cardFullName: string;
  cardNumber: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardToken: string;
}
interface BillingModel extends mongoose.Model<BillingDoc> {
  build(attrs: BillingAttrs): BillingDoc;
}
const billingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    cardFullName: {
      type: String,
      required: true,
    },
    cardNumber: {
      type: String,
      required: true,
    },
    cardExpiryMonth: {
      type: String,
      required: true,
    },
    cardExpiryYear: {
      type: String,
      required: true,
    },
    cardToken: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        // delete ret.cardToken;
      },
    },
  }
);

billingSchema.statics.build = (attrs: BillingAttrs) => {
  return new Billing({
    _id: attrs.id,
    userId: attrs.userId,
    cardNumber: attrs.cardNumber,
    cardFullName: attrs.cardFullName,
    cardExpiryYear: attrs.cardExpiryYear,
    cardExpiryMonth: attrs.cardExpiryMonth,
    cardToken: attrs.cardToken,
  });
};
const Billing = mongoose.model<BillingDoc, BillingModel>(
  'Billing',
  billingSchema
);

export { Billing };
