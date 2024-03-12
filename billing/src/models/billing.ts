import mongoose from 'mongoose';
// import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface BillingAttrs {
  userId: string;
  cardFullName: string;
  cardNumber: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardToken?: string;
  transactionId?: string;
  txRef?: string;
  flwRef?: string;
}

interface BillingDoc extends mongoose.Document {
  userId: string;
  cardFullName: string;
  cardNumber: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardToken?: string;
  transactionId?: string;
  completed: boolean;
  txRef?: string;
  flwRef?: string;
  createdAt: Date;
  // version: number;
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
    transactionId: {
      type: String,
      required: false,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    txRef: {
      type: String,
      required: false,
    },
    flwRef: {
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
        delete ret.cardToken;
      },
    },
  }
);

// billingSchema.set('versionKey', 'version');
// billingSchema.plugin(updateIfCurrentPlugin);

billingSchema.statics.build = (attrs: BillingAttrs) => {
  return new Billing(attrs);
};
const Billing = mongoose.model<BillingDoc, BillingModel>(
  'Billing',
  billingSchema
);

export { Billing };
