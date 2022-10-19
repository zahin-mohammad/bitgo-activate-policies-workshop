import { BitGo } from "bitgo";
import * as inquirer from "inquirer";

const bitgo = new BitGo({env: 'test'});

type JoinWalletParams = {
	loginEmail: string;
	loginPassword: string;
	walletId: string;
};

async function joinWallet({
	loginEmail,
	loginPassword,
	walletId,
}: JoinWalletParams) {
	await bitgo.authenticate({
		username: loginEmail,
		password: loginPassword,
		otp: "000000",
	});
	await bitgo.unlock({ otp: "000000" });

	const res = await bitgo.get(bitgo.url("/walletshares", 2));
	const walletShares = res.body.incoming.filter((walletShare) => {
		if (walletId) {
			return walletShare.wallet === walletId;
		}
		return true;
	});
	console.log(`accepting ${walletShares.length} wallet shares`);
	for (const walletShare of walletShares) {
		await bitgo.coin(walletShare.coin).wallets().acceptShare({
			walletShareId: walletShare.id,
			userPassword: loginPassword,
		});
		console.log(`accepted wallet share for wallet: ${walletShare.wallet}`);
		const wallet = await bitgo
			.coin(walletShare.coin)
			.wallets()
			.get({ id: walletShare.wallet });
		console.log(`wallet name: ${wallet.toJSON().label}`);
	}
}

const prompts = [
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
		type: "input",
		name: "walletId",
		message: "Want to join a specific wallet? (walletId):",
	},
];

if (require.main === module) {
	inquirer.prompt(prompts).then(async (answers) => {
		try {
			await joinWallet(answers);
		} catch (e) {
			console.log(`unexpected error ${e}`);
		}
	});
}
