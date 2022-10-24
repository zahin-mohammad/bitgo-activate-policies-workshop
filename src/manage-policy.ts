import { BitGo, PendingApproval, PendingApprovals } from "bitgo";
import * as inquirer from "inquirer";

const bitgo = new BitGo({ env: "test" });

/*
 * Exercises!
 */

/*
 * Task: Given a pending approval id in the params, approve the associated pending approval!
 * Hint: view getPendingApproval to see how to access the pending approval objects in the SDK
 */
async function approvePendingApproval(params: BasePrompt & ExercisePrompt) {
	throw new Error("Implement me!");
}

/*
 * Task: Given a pending approval id in the params, reject the associated pending approval!
 * Hint: view getPendingApproval to see how to access the pending approval objects in the SDK
 */
async function rejectPendingApproval(params: BasePrompt & ExercisePrompt) {
	throw new Error("Implement me!");
}

/*
 * Task: Given a pending approval that the current user created, rescind it
 * Hint: view getPendingApproval to see how to access the pending approval objects in the SDK
 */
async function rescindPendingApproval(params: BasePrompt & ExercisePrompt) {
	throw new Error("Implement me!");
}

/*
 * Task: create an advancedWhitelist policy rule that will deny all transactions not in the whitelist
 * Note: You may use 2mL1GH2KAevXzCQ7qVZGeRUd1C1uzrmNvZ5AysK1WPJm as a default whitelist (instructors hot wallet)
 * Hint: https://developers.bitgo.com/api/v2.wallet.createpolicy
 * 	to see what condition to pass, view the second `object` spec
 *  id is required
 */
async function startWhitelistPolicyExercise(
	params: BasePrompt & ExercisePrompt
) {
	const ruleId = "my whitelist policy rule";
	if (await hasPolicyRule(params, ruleId)) {
		console.log("task done!");
		return;
	}
	throw new Error("Implement me!");
	const res = await bitgo
		.post(
			bitgo.url(`/${params.coin}/wallet/${params.walletId}/policy/rule`, 2)
		)
		.send({
			// todo
		});
	console.log(res.body);
	if (res.body.pendingApproval) {
		console.log("\n\n Pending Approval Required!");
		console.log(
			`Run this script in a new terminal session to approve pending approval ${res.body.pendingApproval.id}`
		);
	}
}

/*
 * Task: create an allTx policy rule where all transactions require a pending approval
 * Hint: https://developers.bitgo.com/api/v2.wallet.createpolicy
 * 	to see what condition to pass, view the sixth `object` spec
 *  in this case, we can use an empty condition object `condition: {}`
 *  id is required
 */
async function startAllTxPolicyExercise(params: BasePrompt & ExercisePrompt) {
	const ruleId = "my allTx policy rule";
	if (await hasPolicyRule(params, ruleId)) {
		console.log("task done!");
		return;
	}
	throw new Error("Implement me!");
	const res = await bitgo
		.post(
			bitgo.url(`/${params.coin}/wallet/${params.walletId}/policy/rule`, 2)
		)
		.send({
			// todo
		});

	console.log(res.body);
	if (res.body.pendingApproval) {
		console.log("\n\n Pending Approval Required!");
		console.log(
			`Run this script in a new terminal session to approve pending approval ${res.body.pendingApproval.id}`
		);
	}
}

/*
 * Task: create a velocity limit rule where more than 1 SOL (1000000000 LAMPORTS) in a 1 Hour time frame requires a pending approval
 * HINT: 1 SOL = 1000000000 LAMPORTS (base units of sol)
 *  https://developers.bitgo.com/api/v2.wallet.createpolicy
 * 	to see what condition to pass, view the first `object` spec
 *  in this case, we can use an empty condition object `condition: {}`
 *  id is required
 */
async function startVelocityPolicyExercise(
	params: BasePrompt & ExercisePrompt
) {
	const ruleId = "my velocity policy rule";
	if (await hasPolicyRule(params, ruleId)) {
		console.log("task done!");
		return;
	}
	throw new Error("Implement me!");
	const res = await bitgo
		.post(
			bitgo.url(`/${params.coin}/wallet/${params.walletId}/policy/rule`, 2)
		)
		.send({
			// todo
		});
	console.log(res.body);
	if (res.body.pendingApproval) {
		console.log("\n\n Pending Approval Required!");
		console.log(
			`Run this script in a new terminal session to approve pending approval ${res.body.pendingApproval.id}`
		);
	}
}

const promptBase = [
	{
		type: "input",
		name: "loginEmail",
		message: "BitGo testnet login email:",
		validate: async function (email) {
			if (!email) {
				return "Email is required!";
			}
			return true;
		},
	},
	{
		type: "password",
		name: "loginPassword",
		message: "BitGo testnet login password:",
		validate: async function (loginPassword, answers) {
			try {
				await bitgo.authenticate({
					username: answers.loginEmail,
					password: loginPassword,
					otp: "000000",
				});
				const user = await bitgo.me();
				console.log(`welcome back ${user.name.full}`);
				return true;
			} catch (e) {
				return `Failed to authenticate, ${e}`;
			}
		},
	},
	{
		type: "list",
		name: "coin",
		message: "What coin should be used for the wallet?",
		choices: [
			{
				key: "tsol",
				name: "Testnet solana (tss)",
				value: "tsol",
			},
		],
	},
	{
		type: "input",
		name: "walletId",
		message: "BitGo testnet walletId:",
		validate: async function (walletId, answers) {
			try {
				const wallet = await getWalletAPI({
					coin: answers.coin,
					walletId,
				});
				console.log(` wallet ${wallet.label}`);
				return true;
			} catch (e) {
				return `Failed to fetch wallet, ${e}`;
			}
		},
	},
];

const exercisePrompt = [
	{
		type: "list",
		name: "step",
		message: "What would you like to do?",
		choices: [
			{
				key: "whitelist",
				name: "Create Whitelist Rule - triggers when a transaction is attempted that sends to a destination that is not on the whitelist",
				value: "whitelist",
			},
			{
				key: "allTx",
				name: "Create All Transactions Rule - triggers on all transactions",
				value: "allTx",
			},
			{
				key: "velocity",
				name: "Create Velocity Limit Rule - triggers when the amount of funds (denominated in a coin) that left the Wallet/ Enterprise over a predetermined amount of time exceeds a predetermined limit",
				value: "velocity",
			},
			{
				key: "getPendingApproval",
				name: "View Pending Approvals",
				value: "getPendingApproval",
			},
			{
				key: "approvePendingApproval",
				name: "Approve Pending Approval",
				value: "approvePendingApproval",
			},
			{
				key: "getWalletPolicies",
				name: "View Wallet Policies",
				value: "getWalletPolicies",
			},
			{
				key: "whoami",
				name: "Who am I? 🤯",
				value: "whoami",
			},
		],
	},
	{
		type: "input",
		name: "pendingApprovalId",
		message: "Pending Approval Id (optional):",
		when: function (answers) {
			return (
				answers.step === "approvePendingApproval" ||
				answers.step === "getPendingApproval"
			);
		},
		validate: function (pendingApprovalId, answers) {
			if (
				!pendingApprovalId &&
				answers.step === "approvePendingApproval"
			) {
				return "Must supply pendingApprovalId when approving";
			}
			return true;
		},
	},
];

type BasePrompt = {
	loginEmail: string;
	loginPassword: string;
	coin: string;
	walletId: string;
};

type ExercisePrompt = {
	step:
		| "whitelist"
		| "allTx"
		| "velocity"
		| "getPendingApproval"
		| "approvePendingApproval"
		| "getWalletPolicies"
		| "whoami";
	pendingApprovalId?: string;
};

if (require.main === module) {
	inquirer.prompt(promptBase).then(async (base: BasePrompt) => {
		while (true) {
			await bitgo.authenticate({
				username: base.loginEmail,
				password: base.loginPassword,
				otp: "000000",
			});
			await inquirer
				.prompt(exercisePrompt)
				.then(async (exercise: ExercisePrompt) => {
					console.log(`\n\n${exercise.step}`);
					try {
						switch (exercise.step) {
							case "whitelist":
								await startWhitelistPolicyExercise({
									...base,
									...exercise,
								});
								break;
							case "allTx":
								await startAllTxPolicyExercise({
									...base,
									...exercise,
								});
								break;
							case "velocity":
								await startVelocityPolicyExercise({
									...base,
									...exercise,
								});
								break;
							case "getPendingApproval":
								await getPendingApproval({
									...base,
									...exercise,
								});
								break;
							case "approvePendingApproval":
								await approvePendingApproval({
									...base,
									...exercise,
								});
								break;
							case "getWalletPolicies":
								await getWalletPolicies({
									...base,
									...exercise,
								});
								break;
							case "whoami":
								console.log(`\n\n`);
								const user = await bitgo.me();
								console.log(`Hey there ${user.name.full}`);
								break;
							default:
								throw new Error(
									`rule ${exercise.step} is not supported in this workshop`
								);
						}
					} catch (e) {
						console.log(e);
					}
					console.log(`\n\n`);
				});
		}
	});
}

/*
 * HELPERS
 */
async function getWalletAPI({
	coin,
	walletId,
}: {
	coin: string;
	walletId: string;
}): Promise<any> {
	const res = await bitgo.get(bitgo.url(`/${coin}/wallet/${walletId}`, 2));
	return res.body;
}
async function hasPolicyRule(
	params: BasePrompt,
	ruleId: string
): Promise<boolean> {
	const wallet = await getWalletAPI(params);
	const ruleIndex = wallet.admin?.policy?.rules.findIndex(
		(rule) => rule.id === ruleId
	);
	if (ruleIndex && ruleIndex > -1) {
		console.log(wallet.admin.policy.rules[ruleIndex]);
		return true;
	}
	return false;
}
async function getWalletPolicies(params: BasePrompt) {
	const wallet = await getWalletAPI(params);
	console.log(wallet.admin?.policy ?? "no policy found");
}

async function getPendingApproval(params: BasePrompt & ExercisePrompt) {
	if (params.pendingApprovalId) {
		const pa = await bitgo
			.coin(params.coin)
			.pendingApprovals()
			.get({ id: params.pendingApprovalId });
		console.log(pa.id(), pa.type(), pa.info());
	} else {
		const pendingApprovals = await (
			await bitgo
				.coin(params.coin)
				.pendingApprovals()
				.list({ walletId: params.walletId })
		).pendingApprovals;
		pendingApprovals.forEach((pa) => {
			console.log(pa.id(), pa.type(), pa.info());
		});
	}
}
