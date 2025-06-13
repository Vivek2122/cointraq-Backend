import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateAccessToken, generateRefreshToken } from "./userController.mjs";
import User from "../Models/userModel.mjs";

dotenv.config();

export const handleGoogleLogin = async (profile) => {
	try {
		if (!profile) throw new Error("No profile provided");

		const email = profile.emails[0].value;
		const fullName = profile.displayName;

		let user = await User.findOne({ email });

		if (!user) {
			user = await User.create({
				email,
				fullName,
			});
		}

		const accessToken = generateAccessToken({
			id: user._id,
			email: user.email,
		});

		const refreshToken = generateRefreshToken({
			id: user._id,
			email: user.email,
		});

		return { accessToken, refreshToken, user };
	} catch (err) {
		console.error("Error in handleGoogleLogin:", err.message);
		throw err;
	}
};

const authenticate = async (req, res, next) => {
	const accessToken = req.cookies.accessToken;
	const refreshToken = req.cookies.refreshToken;
	if (accessToken) {
		try {
			const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
			const userInfo = await User.findById(decoded.id);
			req.user = {
				id: decoded.id,
				email: decoded.email,
				name: userInfo.fullName,
			};
			return next();
		} catch (err) {
			console.log("Access token error:", err.message);
		}
	}

	if (!refreshToken) {
		return res.status(401).json({ msg: "Unauthorized. No valid tokens." });
	}

	try {
		const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
		const userInfo = await User.findById(decoded.id);
		req.user = {
			id: decoded.id,
			email: decoded.email,
			name: userInfo.fullName,
		};

		const newAccessToken = generateAccessToken({
			id: decoded.id,
			email: decoded.email,
		});
		res.cookie("accessToken", newAccessToken, {
			httpOnly: true,
			secure: true,
			sameSite: "None",
			maxAge: 15 * 60 * 1000,
		});

		return next();
	} catch (err) {
		console.log("Refresh token error:", err.message);
		return res
			.status(401)
			.json({ msg: "Invalid or expired token for refresh." });
	}
};

export default authenticate;
