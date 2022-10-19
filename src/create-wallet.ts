import { BitGo } from "bitgo";
import * as inquirer from "inquirer";

const bitgo = new BitGo({ env: "test" });

type CreateWalletParams = {
	loginPassword: string;
	coin: string;
	walletPassPhrase: string;
	enterpriseId: string;
	user2Email?: string;
};

async function createWallet({
	loginPassword,
	coin,
	walletPassPhrase,
	enterpriseId,
	user2Email,
}: CreateWalletParams) {
	walletPassPhrase = walletPassPhrase ? walletPassPhrase : loginPassword;
	const bitgoCoin = bitgo.coin(coin);
	const multisigType = bitgoCoin.supportsTss
		? "tss"
		: bitgoCoin.supportsBlsDkg
		? "blsdkg"
		: "onchain";

	console.log("\n\ncreating wallet, this might take a few seconds....");
	await bitgo.unlock({ otp: "000000" });
	const res = await bitgoCoin.wallets().generateWallet({
		enterprise: enterpriseId,
		label: "Hello Activate " + new Date().toString(),
		passphrase: walletPassPhrase,
		multisigType,
	});
	console.log(res);
	console.log("walletId", res.wallet.id());

	console.log(`\n\nsharing wallet with ${user2Email}`);
	await res.wallet.shareWallet({
		email: user2Email,
		walletPassphrase: walletPassPhrase,
		permissions: "view,spend,admin",
	});
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
		type: "list",
		name: "coin",
		message: "What coin should be used for the wallet?",
		choices: [
			{
				key: "tsol",
				name: "Testnet solana (tss)",
				value: "tsol",
			},
			{
				key: "tbtc",
				name: "Testnet bitcoin (multisig)",
				value: "tbtc",
			},
			{
				key: "gteth",
				name: "Testnet goerli ethereum (multisig)",
				value: "gteth",
			},
		],
	},
	{
		type: "password",
		name: "walletPassPhrase",
		message:
			"Use a separate Wallet passphrase? (optional, login password will be used by default):",
	},
	{
		type: "password",
		name: "walletPassPhraseValidate",
		message: "Re-enter passphrase:",
		when: function (answers) {
			return answers.walletPassPhrase;
		},
		validate: function (passphraseValidate, answers) {
			if (passphraseValidate !== answers.walletPassPhrase) {
				return "Passphrase must match!";
			}
			return true;
		},
	},
	{
		type: "input",
		name: "user2Email",
		message: "Invite user (email):",
		validate: function (user2Email) {
			if (!user2Email || user2Email === "") {
				return "Must invite another user for this demo :)";
			}
			return true;
		},
	},
];

if (require.main === module) {
	inquirer.prompt(prompts).then(async (answers) => {
		// console.log(JSON.stringify(answers, null, "  "));
		await createWallet(answers);
	});
}
