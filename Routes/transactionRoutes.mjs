import express from "express";
import authenticate from "../Controllers/authController.mjs";
import Transaction from "../Models/transactionModel.mjs";

const router = express.Router();
router.use(authenticate);

router.post("/income", async (req, res) => {
	const { source, amount, date } = req.body;
	try {
		const email = req.user.email;
		const transaction = new Transaction({
			user: email,
			type: "income",
			source,
			amount: Number(amount),
			date,
		});
		await transaction.save();
		return res.status(201).json({ msg: "Income added successfully." });
	} catch (err) {
		console.log(err.message);
		return res.status(500).json({ err: err.message });
	}
});

router.post("/expense", async (req, res) => {
	const { category, amount, date } = req.body;
	try {
		const email = req.user.email;
		const transaction = new Transaction({
			user: email,
			type: "expense",
			source: category,
			amount: Number(amount),
			date,
		});
		await transaction.save();
		return res.status(201).json({ msg: "Expense added successfully." });
	} catch (err) {
		console.log(err.message);
		return res.status(500).json({ err: err.message });
	}
});

router.get("/income", async (req, res) => {
	try {
		const { range, from, to } = req.query;

		const query = { user: req.user.email, type: "income" };

		if (range && range !== "all") {
			if (range === "custom") {
				// Validate 'from' and 'to'
				if (!from || !to) {
					return res
						.status(400)
						.json({
							error:
								"'from' and 'to' query parameters are required for custom range",
						});
				}
				const fromDate = new Date(from);
				const toDate = new Date(to);

				if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
					return res
						.status(400)
						.json({
							error: "'from' and 'to' must be valid dates (YYYY-MM-DD)",
						});
				}

				if (fromDate > toDate) {
					return res
						.status(400)
						.json({
							error: "'from' date must be before or equal to 'to' date",
						});
				}

				query.date = {
					$gte: fromDate,
					$lte: toDate,
				};
			} else {
				// Numeric range in days
				const days = parseInt(range, 10);
				if (isNaN(days) || days <= 0) {
					return res
						.status(400)
						.json({
							error:
								"'range' must be a positive number of days, 'custom', or 'all'",
						});
				}

				const fromDate = new Date();
				fromDate.setHours(0, 0, 0, 0); // reset to start of today to avoid time issues
				fromDate.setDate(fromDate.getDate() - days);

				query.date = { $gte: fromDate };
			}
		}
		// else: no date filter or range === 'all', fetch all

		const transactions = await Transaction.find(query).sort({ date: -1 });

		res.json({ transactions });
	} catch (err) {
		console.error("Error fetching income transactions:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get("/expense", async (req, res) => {
	try {
		const { range, from, to } = req.query;

		const query = { user: req.user.email, type: "expense" };

		if (range && range !== "all") {
			if (range === "custom") {
				// Validate 'from' and 'to'
				if (!from || !to) {
					return res
						.status(400)
						.json({
							error:
								"'from' and 'to' query parameters are required for custom range",
						});
				}
				const fromDate = new Date(from);
				const toDate = new Date(to);

				if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
					return res
						.status(400)
						.json({
							error: "'from' and 'to' must be valid dates (YYYY-MM-DD)",
						});
				}

				if (fromDate > toDate) {
					return res
						.status(400)
						.json({
							error: "'from' date must be before or equal to 'to' date",
						});
				}

				query.date = {
					$gte: fromDate,
					$lte: toDate,
				};
			} else {
				// Numeric range in days
				const days = parseInt(range, 10);
				if (isNaN(days) || days <= 0) {
					return res
						.status(400)
						.json({
							error:
								"'range' must be a positive number of days, 'custom', or 'all'",
						});
				}

				const fromDate = new Date();
				fromDate.setHours(0, 0, 0, 0); // reset to start of today
				fromDate.setDate(fromDate.getDate() - days);

				query.date = { $gte: fromDate };
			}
		}
		// else: no date filter or range === 'all', fetch all

		const transactions = await Transaction.find(query).sort({ date: -1 });

		res.json({ transactions });
	} catch (err) {
		console.error("Error fetching expense transactions:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.delete("/delete/:id", async (req, res) => {
	const id = req.params.id;
	try {
		const deleted = await Transaction.findByIdAndDelete(id);
		if (!deleted) {
			return res.status(404).json({ msg: "Resource not found" });
		}
		res.status(200).json({ msg: "Deleted successfully" });
	} catch (err) {
		res.status(500).json({ msg: "Server error during deletion" });
	}
});

router.patch("/update/:id", async (req, res) => {
	const id = req.params.id;
	const updateData = req.body;
	try {
		const updatedDoc = await Transaction.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		});
		if (!updatedDoc) {
			return res.status(404).json({ msg: "Resource not found" });
		}

		res.status(200).json({ msg: "Updated successfully", data: updatedDoc });
	} catch (err) {
		res.status(500).json({ msg: "Server error during update" });
	}
});

export default router;
