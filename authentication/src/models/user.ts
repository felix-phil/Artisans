import mongoose from 'mongoose';
import { Hashing } from '../services/hashing';
import { UserRoles } from '@theartisans/shared/build';
import { imageHandler } from '../image-handler';

// Interface required to create a new User
interface UserAttrs {
  email: string;
  password: string;
}

// Interface that describes what a user document has
export interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  devices: string[];
  mobileNumber?: string;
  profileImage?: string;
  profileImageUrl?: string;
  active: boolean;
  banned: boolean;
  location?: string;
  dateJoined?: Date;
  lastLogin?: Date;
  loginCount: number;
  roles: UserRoles[];
  hashedOTP?: string;
  hashedOTPExpirationDate?: Date;
}

// Interface that describes props of a User model
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    profileImage: {
      type: String,
      required: false,
    },
    mobileNumber: {
      type: String,
      required: false,
    },
    devices: [
      {
        _id: false,
        type: String,
      },
    ],
    active: {
      type: Boolean,
      default: false,
    },
    banned: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      required: false,
    },
    dateJoined: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      required: false,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    roles: [
      {
        type: String,
        required: true,
        enum: Object.values(UserRoles),
        default: UserRoles.Normal,
      },
    ],
    hashedOTP: {
      type: String,
      required: false,
    },
    hashedOTPExpirationDate: {
      type: Date,
      required: false,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        ret.profileImageUrl = ret.profileImage
          ? imageHandler.getUploadedFileSignUrl(ret.profileImage)
          : undefined;
        delete ret._id;
        delete ret.password;
        delete ret.hashedOTP;
        delete ret.hashedOTPExpirationDate;
        delete ret.devices;
        delete ret.__v;
      },
    },
  }
);
userSchema.pre('save', async function (done) {
  if (this.isModified('password')) {
    const hashed = await Hashing.toHash(this.get('password'));
    this.set('password', hashed);
  }
  done();
});

userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
