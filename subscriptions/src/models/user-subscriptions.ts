import { SubscriptionType } from '@theartisans/shared/build';
import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface UserSubscriptionAttrs {
  userId: string;
  transactionId: string; // From payment
  subscriptionType: SubscriptionType;
  expiryDate: Date;
}

interface UserSubscriptionDoc extends mongoose.Document {
  userId: string;
  transactionId: string;
  dateCreated: Date;
  dateUpdated: Date;
  subscriptionType: SubscriptionType;
  expiryDate: Date;
  version: number;
}
interface UserSubscriptionModel extends mongoose.Model<UserSubscriptionDoc> {
  build(attrs: UserSubscriptionAttrs): UserSubscriptionDoc;
}
const userSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    transactionId: { type: String },
    subscriptionType: {
      type: String,
      required: true,
      enum: Object.values(SubscriptionType),
    },
    dateCreated: {
      type: Date,
      default: Date.now,
    },
    dateUpdated: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
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

userSubscriptionSchema.set('versionKey', 'version');
userSubscriptionSchema.plugin(updateIfCurrentPlugin);

userSubscriptionSchema.statics.build = (attrs: UserSubscriptionAttrs) => {
  return new UserSubscription(attrs);
};
const UserSubscription = mongoose.model<
  UserSubscriptionDoc,
  UserSubscriptionModel
>('UserSubscriptions', userSubscriptionSchema);

export { UserSubscription };
