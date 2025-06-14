import express from "express";
import passport from "passport";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Callback route after Google login
router.get(
	"/google/callback",
	passport.authenticate("google", {
		session: false,
		failureRedirect: "/login",
	}),
	(req, res) => {
		// Tokens from done(null, tokens) in the Google strategy
		const { accessToken, refreshToken } = req.user;

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			sameSite: "None",
			secure: true,
			maxAge: 15 * 60 * 1000,
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			sameSite: "None",
			secure: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		res.redirect("/dashboard");
	}
);

// Initial route to start Google OAuth
router.get(
	"/google",
	passport.authenticate("google", {
		scope: ["profile", "email"],
	})
);

export default router;
