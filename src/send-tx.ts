import { BitGo } from "bitgo";
import * as inquirer from "inquirer";

const bitgo = new BitGo({ env: "test" });

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

async function sendTx(params: BasePrompt) {
	await bitgo.unlock({ otp: "000000" });
	const wallet = await bitgo.coin(params.coin).wallets().get({id: params.walletId});
	const tx = await wallet.prebuildAndSignTransaction({
        recipients: [{
            address: params.destination,
            amount: params.amount,
        }],
        walletPassphrase: params.loginPassword,
		type: 'transfer',
    });
	const sentTx = await wallet.submitTransaction(tx);
	console.log(sentTx.status);
	console.log(sentTx.txid);
	if (sentTx.pendingApproval) {
		console.log(sentTx.pendingApproval.id)
		console.log(sentTx.pendingApproval.resolvers);
	}
	console.log(sentTx.pendingApproval?.id ?? "no pending approval needed :)")
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
		message: "What coin does the wallet use?",
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
	{
		type: "input",
		name: "destination",
		message: "Destination Address:",
	},
	{
		type: "input",
		name: "amount",
		message: "Amount to send:",
		default: "100",
	},
];

type BasePrompt = {
	loginEmail: string;
	loginPassword: string;
	coin: string;
	walletId: string;
	amount: string;
	destination: string;
};

if (require.main === module) {
	inquirer.prompt(promptBase).then(async (answers: BasePrompt) => {
		try {
			await sendTx(answers);
		} catch (e) {
			console.log(`unexpected error ${e}`);
		}
	});
}
