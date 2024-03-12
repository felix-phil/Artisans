import mongoose, { mongo } from "mongoose";

interface CategoryAttrs {
  name: string;
  description: string;
}
interface SubcategoryAttrs {
  name: string;
  description: string;
  category: CategoryDoc;
}
export interface SubcategoryDoc extends mongoose.Document {
  name: string;
  description: string;
  category: string | mongoose.Schema.Types.ObjectId | CategoryDoc;
}

interface CategoryDoc extends mongoose.Document {
  name: string;
  description: string;
  subcategories: SubcategoryDoc[];
  createdAt: Date;
  updatedAt: Date;
}
interface SubcategoryModel extends mongoose.Model<SubcategoryDoc> {
  build(attrs: SubcategoryAttrs): SubcategoryDoc;
}
interface CategoryModel extends mongoose.Model<CategoryDoc> {
  build(attrs: CategoryAttrs): CategoryDoc;
}
const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requireed: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
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
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      requireed: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    subcategories: [
      { _id: false, type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    ],
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

subcategorySchema.pre("save", function (done) {
  if (this.isModified("name")) {
    this.set("name", this.get("name").toLowerCase());
  }
  done();
});

subcategorySchema.statics.build = (attrs: SubcategoryAttrs) => {
  return new Subcategory(attrs);
};
const Subcategory = mongoose.model<SubcategoryDoc, SubcategoryModel>(
  "Subcategory",
  subcategorySchema
);
categorySchema.pre("save", function (done) {
  if (this.isModified("name")) {
    this.set("name", this.get("name").toLowerCase());
  }
  done();
});
categorySchema.statics.build = (attrs: CategoryAttrs) => {
  return new Category(attrs);
};
const Category = mongoose.model<CategoryDoc, CategoryModel>(
  "Category",
  categorySchema
);

export { Category, Subcategory };
