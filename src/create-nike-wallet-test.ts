import { BitGo } from "bitgo";
import * as inquirer from "inquirer";

const bitgo = new BitGo({ env: "test" });


async function createWallet(params: BasePrompt & CreateWalletPrompt) {
	const bitgoCoin = bitgo.coin('tpolygon');
	console.log("\n\ncreating wallet, this might take a few seconds....");
	await bitgo.unlock({ otp: "000000" });
	const res = await bitgoCoin.wallets().generateWallet({
		enterprise: params.enterpriseId,
		label:  params.label ? params.label : "Hello Activate " + new Date().toString(),
		passphrase: params.loginPassword,
		multisigType: 'tss',
		walletVersion: 3,
	});
	console.log(res);
	console.log("walletId", res.wallet.id());
}

const basePrompt = [
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
];

type BasePrompt = {
	loginEmail: string;
	loginPassword: string;
}

const createWalletPrompt = [
	{
		type: "input",
		name: "enterpriseId",
		message: "BitGo testnet enterpriseId:",
		validate: async function (enterpriseId, answers) {
			try {
				const enterprise = await bitgo.get(
					bitgo.url(`/enterprise/${enterpriseId}`, 2)
				);
				console.log(` enterprise ${enterprise.body.name}`);
				return true;
			} catch (e) {
				return `Failed to fetch enterprise, ${e}`;
			}
		},
	},
	{
		type: "input",
		name: "label",
		message: "Use a custom wallet label? (optional) ",
	}
];

type CreateWalletPrompt = {
	enterpriseId: string;
	label?: string;
	user2Email?: string;
}

if (require.main === module) {
	inquirer.prompt(basePrompt).then(async (base: BasePrompt) => {
		while (true) {
			await bitgo.authenticate({
				username: base.loginEmail,
				password: base.loginPassword,
				otp: "000000",
			});
			await inquirer
				.prompt(createWalletPrompt)
				.then(async (params: CreateWalletPrompt) => {
					console.log(`\n\n`);
					await createWallet({
						...base,
						...params,
					});
			});
		}
	});
}
