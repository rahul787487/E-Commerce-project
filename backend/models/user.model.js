import mongoose from "mongoose";
import bcrypt from "bcryptjs";
 

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required:[true, "Name is required"],
    },
    email: {
        type: String,
        required:[true, "Email is required"],
        unique: true,   
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required:[true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    cartItems: [
        {
            quantity: {
                type: Number,
                default: 1,
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        },
    ],
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer",
    },
    //createdAt and updatedAt will be added automatically by mongoose with timestamps: true option
}, { timestamps: true });
   
// remove sensitive fields when converting to JSON (res.json / toObject)
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        // remove sensitive or internal fields
        delete ret.password;
        delete ret.__v;
        // keep id instead of _id for clients
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

// pre-save hook to hash password before saving use
userSchema.pre("save", async function (next) {
    // if password is not modified, skip hashing
    if (!this.isModified("password")) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});
 // compare entered password with hashed password in database
userSchema.methods.comparePassword = async function (Password) {
    return await bcrypt.compare(Password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;