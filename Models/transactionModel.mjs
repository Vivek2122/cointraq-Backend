import mongoose from "mongoose"

const transactionSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true})

const Transaction = mongoose.model("Transaction", transactionSchema)

export default Transaction