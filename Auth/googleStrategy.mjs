import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { handleGoogleLogin } from "../Controllers/authController.mjs";

dotenv.config();

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: `https://coin-traq-api.onrender.com/auth/google/callback`,
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				// Call the helper function that handles everything
				const tokens = await handleGoogleLogin(profile);

				// Pass JWT tokens to the next step
				return done(null, tokens);
			} catch (err) {
				console.error("Google Strategy Error:", err.message);
				return done(err, null);
			}
		}
	)
);

// Not using sessions, but required to prevent errors
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
