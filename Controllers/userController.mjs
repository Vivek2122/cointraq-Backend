import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../Models/userModel.mjs";

dotenv.config();

const generateAccessToken = (userPayload) => {
	return jwt.sign(userPayload, process.env.JWT_ACCESS_KEY, {
		expiresIn: "15m",
	});
};

const generateRefreshToken = (userPayload) => {
	return jwt.sign(userPayload, process.env.JWT_REFRESH_KEY, {
		expiresIn: "7d",
	});
};

async function handleGoogleLogin(profile) {
  // Extract basic info from profile
  const email = profile.emails?.[0]?.value || "";
  const name = profile.displayName || "";

  // Find if user already exists
  let user = await User.findOne({ email });

  if (!user) {
    // Create a new user if not found
    user = new User({
      email,
      name,
      // any other default fields
    });

    await user.save();
  }

  // Generate JWT tokens for this user
  const payload = {
    id: user._id,
    email: user.email,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_KEY, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_KEY, {
    expiresIn: "7d",
  });

  // Return tokens or any user info you want
  return { accessToken, refreshToken, user };
}

const verifyAuthorization = (req, res) => {
	try {
		const accessToken = req.cookies.accessToken;

		if (accessToken) {
			try {
				const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
				// Access token valid
				return res.status(200).json({ msg: "You are already logged in." });
			} catch (err) {
				// Access token invalid or expired — we will try refresh token next
			}
		}

		// If no access token or invalid, try refresh token
		const refreshToken = req.cookies.refreshToken;

		if (refreshToken) {
			try {
				const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
				req.user = decoded;

				const newAccessToken = generateAccessToken({
					id: decoded.id,
					email: decoded.email,
				});

				res.cookie("accessToken", newAccessToken, {
					httpOnly: true,
					secure: true, 
					sameSite: "None",
					maxAge: 15 * 60 * 1000, // 15 minutes
				});

				return res.status(200).json({ msg: "Logged in successfully." });
			} catch (err) {
				// Refresh token invalid
				return res.status(401).json({ msg: "Invalid refresh token." });
			}
		}

		// Neither access token nor refresh token valid/present
		return res.status(401).json({ msg: "Unauthorized." });
	} catch (err) {
		return res.status(401).json({ "Auth error": err.message });
	}
};

export default verifyAuthorization;

const registerUser = async (req, res) => {
	const { fullName, email, password } = req.body;
	try {
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ msg: "Email already exists." });
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new User({ ...req.body, password: hashedPassword });
		await newUser.save();
		return res.status(201).json({ msg: "User Created Successfully." });
	} catch (err) {
		return res.status(500).json({ msg: "Server Error", error: err.message });
	}
};

const loginUser = async (req, res) => {
	const { email, password } = req.body;
	try {
		let existingUser = await User.findOne({ email });
		if (!existingUser) {
			return res.status(404).json({ msg: "User not found." });
		}
		const isMatch = await bcrypt.compare(password, existingUser.password);
		if (!isMatch) {
			return res.status(400).json({ msg: "Incorrect Password." });
		}

		const accessToken = generateAccessToken({
			id: existingUser._id,
			email: existingUser.email,
		});

		const refreshToken = generateRefreshToken({
			id: existingUser._id,
			email: existingUser.email,
		});

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: "None",
			maxAge: 15 * 60 * 1000,
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "None",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		return res.status(200).json({ msg: "Logged in Successfully." });
	} catch (err) {
		return res.status(500).json({ msg: "Server Error", error: err.message });
	}
};

export {
	registerUser,
	loginUser,
	generateAccessToken,
	generateRefreshToken,
	verifyAuthorization,
	handleGoogleLogin,
};
