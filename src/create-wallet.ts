import { BitGo } from "bitgo";
import * as inquirer from "inquirer";

type CreateWalletParams = {
	bitgoAccessToken: string;
	coin: string;
	walletPassPhrase: string;
};
async function createWallet({
	bitgoAccessToken,
	coin,
	walletPassPhrase,
}: CreateWalletParams) {
  const bitgo = new BitGo({accessToken: bitgoAccessToken, env: 'test'});
  const bitgoCoin = bitgo.coin(coin);
  const multisigType = bitgoCoin.supportsTss ? 'tss' : bitgoCoin.supportsBlsDkg ? 'blsdkg' : 'onchain';
  const res = await bitgoCoin.wallets().generateWallet({
    label: 'Hello Activate ' + new Date().toString(),
    passphrase: walletPassPhrase,
    multisigType,
  });
  console.log(res);
  console.log('walletId', res.wallet.id());
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
				await bitgo.me();
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
		message: "Wallet passphrase:",
		validate: function (passphrase) {
      if (!passphrase || passphrase === "") {
        return 'Passphrase can\'t be empty!';
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
        return 'Passphrase must match!';
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
