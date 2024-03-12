import mongoose from "mongoose";
import { SkillDoc } from "./skills";
import { SubcategoryDoc } from "./services";
import { SubscriptionType } from "@theartisans/shared/build";
import { imageHandler } from "../image-handler";

interface ArtisanAttr {
  userId: string;
  businessName: string;
  businessLocation: {
    country: string;
    latitude: string;
    longitude: string;
    address?: string;
  };
  // skills: SkillDoc[];
  // services: SubcategoryDoc[];
  businessEmail: string;
  subscription: {
    subscriptionType: SubscriptionType;
    expiryDate: Date;
  };
  businessLogo?: string;
  businessPhone?: string[];
  links?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}
interface ArtisanDoc extends mongoose.Document {
  userId: string;
  businessName: string;
  businessLocation: {
    country: string;
    latitude: string;
    longitude: string;
    address?: string;
  };
  skills: mongoose.Types.ObjectId[] | SkillDoc[];
  services: mongoose.Types.ObjectId[] | SubcategoryDoc[];
  businessLogo?: string;
  businessLogoUrl?: string;
  businessPhone?: string[];
  businessEmail: string;
  links?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  subscription: {
    subscriptionType: SubscriptionType;
    expiryDate: Date;
  };
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ArtisanModel extends mongoose.Model<ArtisanDoc> {
  build(attrs: ArtisanAttr): ArtisanDoc;
}

const artisanSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    businessName: { type: String, required: true },
    businessLocation: {
      country: { type: String, required: true },
      latitude: { type: String, required: true },
      longitude: { type: String, required: true },
      address: { type: String, required: false },
    },
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" }],
    businessLogo: { type: String, required: false },
    businessEmail: { type: String, required: true },
    businessPhone: { type: String, required: false },
    links: {
      required: false,
      website: { type: String, required: false },
      twitter: { type: String, required: false },
      instagram: { type: String, required: false },
      linkedin: { type: String, required: false },
    },
    subscription: {
      subscriptionType: { type: String, enum: Object.values(SubscriptionType) },
      expiryDate: { type: Date, required: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        ret.businessLogoUrl = ret.businessLogo
          ? imageHandler.getUploadedFileSignUrl(ret.businessLogo)
          : undefined;
        delete ret._id;
      },
    },
  }
);

artisanSchema.set("versionKey", "version");
artisanSchema.statics.build = (attrs: ArtisanAttr) => {
  return new Artisan(attrs);
};
const Artisan = mongoose.model<ArtisanDoc, ArtisanModel>(
  "Artisan",
  artisanSchema
);
export { Artisan };
