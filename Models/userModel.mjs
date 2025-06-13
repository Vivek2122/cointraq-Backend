import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	fullName: {
		type: String,
		required: [true, "Name is required."],
	},
	email: {
		type: String,
		required: [true, "Email is required."],
		unique: [true, "Email already exists."],
	},
	password: {
		type: String,
		required: false,
	},
});

const User = mongoose.model("User", userSchema);

export default User;
