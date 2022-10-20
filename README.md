# BitGo Activate Policies Workshop
## Reference
- [BitGo Docs](https://developers.bitgo.com)
## Getting Started
1. Fork the repository to your github account (optional)
![Github Fork](./docs/fork.png)
2. Clone the repository 
![Github Clone](./docs/clone.png)
3. Install Dependencies
    - npm >= 6.14.14 (reccomended approach is via [NVM](https://github.com/nvm-sh/nvm))
    - (optional) [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable): `npm install --global yarn`
    - Install packages by running `yarn` or `npm install`

## Workshop
### Pre-Requisite
- access to a testnet enterprise
    - have 2 admin users on the enterprise
        - note down the email and password of the two users as well
    - note down the enterpriseId! It will be used later
    - you can create a `scratchpad.txt` file to store these fields
### Commands
There are two commands used in this workshop.
Its recommended to have two terminal sessions for each command (1 for each user).

Refer to the slides.pdf in the docs for the workshop presentation :)

- `yarn run manage-wallet`
- `yarn run policy-exercise`
    