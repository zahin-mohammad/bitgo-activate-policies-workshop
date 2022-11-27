import { BitGo } from "bitgo";
import * as inquirer from "inquirer";

const bitgo = new BitGo({ env: "prod" });


async function createWallet(params: BasePrompt & CreateWalletPrompt) {
	const bitgoCoin = bitgo.coin('polygon');
	console.log("\n\ncreating wallet, this might take a few seconds....");
	const res = await bitgoCoin.wallets().generateWallet({
		enterprise: params.enterpriseId,
		passphrase: 'Abcd@3478q72fgquguygewuf7wq2tr26rt',
		label:  params.label ? params.label : "Hello Activate " + new Date().toString(),
		multisigType: 'tss',
		// backupProvider: "BitGoKRS",
		walletVersion: 3,
	});
	console.log(res);
	console.log("walletId", res.wallet.id());
}

const basePrompt = [
	{
		type: "input",
		name: "accessToken",
		message: "Prod bearer access token:",
		validate: async function (accessToken, answers) {
			try {
				await bitgo.authenticateWithAccessToken({
					accessToken: accessToken
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
	accessToken: string;
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
			await bitgo.authenticateWithAccessToken({
				accessToken: base.accessToken,
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
