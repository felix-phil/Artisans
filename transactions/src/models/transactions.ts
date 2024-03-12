import mongoose from "mongoose";
import {
  TransactionStatusTypes,
  TransactionTypes,
} from "@theartisans/shared/build";

interface TransactionAttrs {
  userId: string;
  email: string;
  transactionType: TransactionTypes;
  gatewayId: string;
  narration: string;
  amount: number;
  dateCreated: Date;
  status: TransactionStatusTypes;
}
interface TransactionDoc extends mongoose.Document {
  userId: string;
  email: string;
  transactionType: TransactionTypes;
  gatewayId: string;
  narration: string;
  amount: number;
  dateCreated: Date;
  status: TransactionStatusTypes;
}
interface TransactionModel extends mongoose.Model<TransactionDoc> {
  build(attrs: TransactionAttrs): TransactionDoc;
}

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      required: true,
      enum: Object.values(TransactionTypes),
    },
    gatewayId: {
      type: String,
      required: true,
    },
    narration: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(TransactionStatusTypes),
    },
    dateCreated: {
      type: Date,
      default: Date.now,
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
transactionSchema.set("versionKey", "version");
transactionSchema.statics.build = (attrs: TransactionAttrs) => {
  return new Transaction(attrs);
};
const Transaction = mongoose.model<TransactionDoc, TransactionModel>(
  "Transaction",
  transactionSchema
);
export { Transaction };
