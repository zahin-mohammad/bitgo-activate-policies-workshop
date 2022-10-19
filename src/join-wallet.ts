import { BitGo } from "bitgo";
import * as inquirer from "inquirer";

type JoinWalletParams = {
	bitgoAccessToken: string;
	walletPassPhrase: string;
	walletId: string;
};
async function joinWallet({
	bitgoAccessToken,
	walletPassPhrase,
	walletId,
}: JoinWalletParams) {
	const bitgo = new BitGo({ accessToken: bitgoAccessToken, env: "test" });
    const res = await bitgo.get(bitgo.url('/walletshares', 2));
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
			userPassword: walletPassPhrase,
		});
		const wallet = await bitgo
			.coin(walletShare.coin)
			.wallets()
			.get({ id: walletShare.wallet });
		console.log(`joined wallet ${wallet.id()}`);
	}
}

const prompts = [
	{
		type: "password",
		name: "bitgoAccessToken",
		message: "BitGo testnet access token:",
		validate: async function (accessToken) {
			const bitgo = new BitGo({
				accessToken,
				env: "test",
			});
			try {
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
	{
		type: "password",
		name: "walletPassPhrase",
		message: "Wallet passphrase:",
		validate: function (passphrase) {
			if (!passphrase || passphrase === "") {
				return "Passphrase can't be empty!";
			}
			return true;
		},
	},
	{
		type: "password",
		name: "walletPassPhraseValidate",
		message: "Re-enter passphrase:",
		validate: function (passphraseValidate, answers) {
			if (passphraseValidate !== answers.walletPassPhrase) {
				return "Passphrase must match!";
			}
			return true;
		},
	},
];

if (require.main === module) {
	inquirer.prompt(prompts).then(async (answers) => {
        try {
            await joinWallet(answers);
        }
        catch(e) {
            console.log(`unexpected error ${e}`);
        }
	});
}
