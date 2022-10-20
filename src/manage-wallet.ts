import { BitGo } from "bitgo";
import * as inquirer from "inquirer";

const bitgo = new BitGo({ env: "test" });


async function getAllWallets(params: {coin: string, enterpriseId: string}): Promise<any> {
    // https://developers.bitgo-dev.com/api/v2.wallet.list
	const res = await bitgo.get(bitgo.url(`/${params.coin}/wallet/?enterprise=${params.enterpriseId}&expandBalance=true&type=hot`, 2));
	return res.body;
}

async function getWalletAPI({
	coin,
	walletId,
}: {
	coin: string;
	walletId: string;
}): Promise<any> {
    // https://developers.bitgo-dev.com/api/v2.wallet.get
	const res = await bitgo.get(bitgo.url(`/${coin}/wallet/${walletId}`, 2));
	return res.body;
}

async function createWallet(params: BasePrompt & CreateWalletPrompt) {
	const bitgoCoin = bitgo.coin(params.coin);
	const multisigType = bitgoCoin.supportsTss
		? "tss"
		: bitgoCoin.supportsBlsDkg
		? "blsdkg"
		: "onchain";

	console.log("\n\ncreating wallet, this might take a few seconds....");
	await bitgo.unlock({ otp: "000000" });
	const res = await bitgoCoin.wallets().generateWallet({
		enterprise: params.enterpriseId,
		label:  params.label ? params.label : "Hello Activate " + new Date().toString(),
		passphrase: params.loginPassword,
		multisigType,
	});
	console.log(res);
	console.log("walletId", res.wallet.id());

	console.log(`\n\nsharing wallet with ${params.user2Email}`);
	await res.wallet.shareWallet({
		email: params.user2Email,
		walletPassphrase: params.loginPassword,
		permissions: "view,spend,admin",
	});
}

async function joinWallets({
	loginEmail,
	loginPassword,
	walletId,
}: BasePrompt & JoinWalletsPrompt) {
	await bitgo.authenticate({
		username: loginEmail,
		password: loginPassword,
		otp: "000000",
	});
	await bitgo.unlock({ otp: "000000" });
    
    // https://developers.bitgo-dev.com/api/v2.wallet.sharing.listallshares
	const res = await bitgo.get(bitgo.url("/walletshares", 2));
	const walletShares = res.body.incoming.filter((walletShare) => {
		if (walletId) {
			return walletShare.wallet === walletId;
		}
		return true;
	});
	console.log(`\n\naccepting ${walletShares.length} wallet shares`);
	for (const walletShare of walletShares) {
		await bitgo.coin(walletShare.coin).wallets().acceptShare({
			walletShareId: walletShare.id,
			userPassword: loginPassword,
		});
		console.log(`\n\naccepted wallet share for wallet: ${walletShare.wallet}`);
		const wallet = await bitgo
			.coin(walletShare.coin)
			.wallets()
			.get({ id: walletShare.wallet });
		console.log(`wallet name: ${wallet.toJSON().label}`);
	}
}

async function sendTx(params: BasePrompt & SendTxPrompt) {
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
    console.log("transferId", sentTx.transfer.id);
	console.log("status", sentTx.status);
	console.log("txId", sentTx.txid);
	if (sentTx.pendingApproval) {
		console.log(sentTx.pendingApproval.id)
		console.log(sentTx.pendingApproval.resolvers);
	} else {
        console.log('no pending approval needed!')
    }
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
];

type BasePrompt = {
    loginEmail: string;
    loginPassword: string;
    coin: string;
}

const exercisePrompt = [
	{
		type: "list",
		name: "step",
		message: "What would you like to do?",
		choices: [
			{
				key: "createWallet",
				name: "Create a New Wallet",
				value: "createWallet",
			},
			{
				key: "joinWallets",
				name: "Accept a Wallet Invite",
				value: "joinWallets",
			},
			{
				key: "sendTx",
				name: "Send a Transaction",
				value: "sendTx",
			},
            {
				key: "viewWallet",
				name: "View Wallet",
				value: "viewWallet",
			},
			{
				key: "whoami",
				name: "Who am I? 🤯",
				value: "whoami",
			},
		],
	},
];

type ExercisePrompt = {
    step: 'createWallet' | 'joinWallets' | 'sendTx' | 'whoami' | 'viewWallet',
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

type CreateWalletPrompt = {
    enterpriseId: string;
    label?: string;
    user2Email: string;
}

const joinWalletsPrompt = [
	{
		type: "input",
		name: "walletId",
		message: "Want to join a specific wallet? (walletId):",
	}
];

type JoinWalletsPrompt = {
    walletId?: string;
}

const viewWalletsPrompt = [
	{
		type: "input",
		name: "walletId",
		message: "WalletId (optional):",
	},
    {
		type: "input",
		name: "enterpriseId",
		message: "EnterpriseId:",
        when: function(answers) {
            return !answers.walletId;
        },
        validate: async function (enterpriseId) {
			try {
				const enterprise = await bitgo.get(
					bitgo.url(`/enterprise/${enterpriseId}`, 2)
				);
				console.log(`enterprise ${enterprise.body.name}`);
				return true;
			} catch (e) {
				return `Failed to fetch enterprise, ${e}`;
			}
		},
	}
];

type ViewWalletsPrompt = {
    walletId?: string;
    enterpriseId?: string;
}

const sendTxPrompt = [
	{
		type: "input",
		name: "walletId",
		message: "BitGo testnet walletId:",
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

type SendTxPrompt = {
    walletId: string;
    destination: string;
    amount: string;
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
				.prompt(exercisePrompt)
				.then(async (exercise: ExercisePrompt) => {
					try {
						switch (exercise.step) {
							case "createWallet":
                                await inquirer
                                    .prompt(createWalletPrompt)
                                    .then(async (params: CreateWalletPrompt) => {
                                        console.log(`\n\n`);
                                        await createWallet({
                                            ...base,
                                            ...params,
                                        });
                                    });
								break;
							case "joinWallets":
                                await inquirer
                                .prompt(joinWalletsPrompt)
                                .then(async (params: JoinWalletsPrompt) => {
                                    await joinWallets({
                                        ...base,
                                        ...params,
                                    });
                                });
                                break;
							case "sendTx":
                                await inquirer
                                    .prompt(sendTxPrompt)
                                    .then(async (params: SendTxPrompt) => {
                                        console.log(`\n\n`);
                                        const wallet = await getWalletAPI({
                                            coin: base.coin,
                                            walletId: params.walletId,
                                        });
                                        console.log(`wallet: ${wallet.label}`);
                                        await sendTx({
                                            ...base,
                                            ...params,
                                        });
                                    });
								break;
                            case "viewWallet":
                                await inquirer
                                    .prompt(viewWalletsPrompt)
                                    .then(async (params: ViewWalletsPrompt) => {
                                        console.log(`\n\n`);
                                        if (params.walletId) {
                                            const wallet = await getWalletAPI({coin: base.coin, walletId: params.walletId})
                                            console.log(wallet);
                                            if (wallet.admin?.policy) {
                                                console.log("policy rules");
                                                console.log(wallet.admin.policy.rules);
                                            }
                                        } else if (params.enterpriseId) {
                                            const res = await getAllWallets({coin: base.coin, enterpriseId: params.enterpriseId})
                                            res.wallets?.forEach((wallet) => {
                                                console.log({
                                                    label: wallet.label,
                                                    id: wallet.id,
                                                    spendableBalanceString: wallet.spendableBalanceString,
                                                })
                                            })
                                        }
                                    });
                                break;
							case "whoami":
								console.log(`\n\n`)
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
					console.log(`\n\n`)
				});
		}
	});
	// inquirer.prompt(basePrompt).then(async (basePrompt: BasePrompt) => {
	// 	// console.log(JSON.stringify(answers, null, "  "));
	// 	await createWallet(answers);
	// });
}
