import mongoose from "mongoose";

interface SkillAttrs {
  name: string;
  description?: string;
}
export interface SkillDoc extends mongoose.Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
interface SkillModel extends mongoose.Model<SkillDoc> {
  build(attrs: SkillAttrs): SkillDoc;
}

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
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
      },
    },
  }
);
skillSchema.statics.build = (attrs: SkillAttrs) => {
  return new Skill(attrs);
};
skillSchema.pre("save", function (done) {
  if (this.isModified("name")) {
    this.set("name", this.get("name").toLowerCase());
  }
  done();
});
const Skill = mongoose.model<SkillDoc, SkillModel>("Skill", skillSchema);
export { Skill };
