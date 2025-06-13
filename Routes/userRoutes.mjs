import express from "express";
import { loginUser, registerUser } from "../Controllers/userController.mjs";
import authenticate from "../Controllers/authController.mjs";
import { verifyAuthorization } from "../Controllers/userController.mjs";

const router = express.Router();

router.post('/', registerUser)
router.post('/login', loginUser)
router.get('/authStatus', verifyAuthorization)
router.get('/getUser', authenticate, (req, res) => {
    res.json({user: req.user})
})
router.get('/dashboard', authenticate, (req, res) => {
    res.sendStatus(200)
})


export default router