import { SubscriptionType } from '@theartisans/shared/build';
import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

interface UserSubscriptionAttrs {
  id: string;
  userId: string;
  subscriptionType: SubscriptionType;
  expiryDate: Date;
  version: number;
}

interface UserSubscriptionDoc extends mongoose.Document {
  userId: string;
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
    subscriptionType: {
      type: String,
      required: true,
      enum: Object.values(SubscriptionType),
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
  return new UserSubscription({
    _id: attrs.id,
    userId: attrs.userId,
    subscriptionType: attrs.subscriptionType,
    expiryDate: attrs.expiryDate,
    version: attrs.version,
  });
};
const UserSubscription = mongoose.model<
  UserSubscriptionDoc,
  UserSubscriptionModel
>('UserSubscriptions', userSubscriptionSchema);

export { UserSubscription };
