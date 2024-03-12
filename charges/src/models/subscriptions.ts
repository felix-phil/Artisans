import { SubscriptionType } from '@theartisans/shared/build';
import mongoose from 'mongoose';

interface SubscriptionAttrs {
  name: SubscriptionType;
  price: number;
  benefits: string[];
}
interface SubscriptionDoc extends mongoose.Document {
  name: SubscriptionType;
  price: number;
  benefits: string[];
}

interface SubscriptionModel extends mongoose.Model<SubscriptionDoc> {
  build(attrs: SubscriptionAttrs): SubscriptionDoc;
}

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    benefits: [
      {
        _id: false,
        type: String,
      },
    ],
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

subscriptionSchema.statics.build = (attrs: SubscriptionAttrs) => {
  return new Subscription(attrs);
};
const Subscription = mongoose.model<SubscriptionDoc, SubscriptionModel>(
  'Subscription',
  subscriptionSchema
);

export { Subscription };
