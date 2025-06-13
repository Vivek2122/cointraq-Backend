import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import "./Auth/googleStrategy.mjs";
import userRouter from "./Routes/userRoutes.mjs";
import transactionRouter from "./Routes/transactionRoutes.mjs";
import authenticate from "./Controllers/authController.mjs";
import Transaction from "./Models/transactionModel.mjs";
import authRouter from "./Routes/authRoutes.mjs";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(
	cors({
		origin: `${process.env.BASE_URL}.com`,
		credentials: true,
	})
);

mongoose
	.connect(process.env.MONGO_URL_USERS)
	.then(() => console.log(`Connected to usersDB`))
	.catch((err) => console.log(`Error connecting to usersDb ${err}`));

const PORT = process.env.PORT || 8080;

app.post("/logout", (req, res) => {
	res.clearCookie("accessToken", {
		httpOnly: true,
		secure: false,
		sameSite: "Lax",
		path: "/",
	});
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: false,
		sameSite: "Lax",
		path: "/",
	});
	res.status(200).json({ msg: "Logged out successfully." });
});
app.get("/dashboard", authenticate, async (req, res) => {
	try {
		const email = req.user.email;
		const transactions = await Transaction.find({
			user: email,
		}).sort({ date: -1 });
		return res.json({ transactions });
	} catch (err) {
		return res.status(500).json({ err: err.message });
	}
});
app.use("/transaction", transactionRouter);
app.use("/auth", authRouter);
app.use("/", userRouter);

app.listen(PORT, () => {
	console.log(`server listening at port ${PORT}`);
});
