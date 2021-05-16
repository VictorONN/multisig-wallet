import Web3 from 'web3';
import TruffleContract from '@truffle/contract';
import multiSigWalletTruffle from '../build/contracts/MultiSigWallet.json';
import BN from 'bn.js';


//@ts-ignore
const MultiSigWallet = TruffleContract(multiSigWalletTruffle);

interface Transaction{
    txIndex: number;
    to: string;
    value: BN;
    data: string;
    executed: boolean;
    numConfirmations: number;
    isConfirmedByCurrentAccount: boolean;
}

interface GetResponse {
    address: string;
    balance: string;
    owners: string[];
    numConfirmationsRequired: number;
    transactionCount: number;
    transactions: Transaction[]; 
}

export async function get(web3: Web3, account: string): Promise<GetResponse> {
MultiSigWallet.setProvider(web3.currentProvider);
const multisig = await MultiSigWallet.deployed();

const owners = await multisig.getOwners();
const numConfirmationsRequired = await multisig.numComfirmationsRequired();
const transactionCount = await multisig.getTransactionCount();
const balance = await web3.eth.getBalance(multisig.address);
/* get 10 most recent transactions
*/

const count = transactionCount.toNumber();
const transactions: Transaction[] = [];
for (let i=1; i <= 10; i++){
    const txIndex = count - i;
    if (txIndex < 0){
        break;
    }
    const tx = await multisig.getTransaction(txIndex);
    const isConfirmed = await multisig.isConfirmed(txIndex, account);

    transactions.push({
        txIndex, 
        to: tx.to, 
        value: tx.value, 
        data: tx.data, 
        executed: tx.executed,
        numConfirmations: tx.numConfirmations.toNumber(),
        isConfirmedByCurrentAccount: isConfirmed,
    })
}
    return{
        address: multisig.address,
        balance,
        owners,
        numConfirmationsRequired: numConfirmationsRequired.toNumber(), 
        transactionCount: 0,
        transactions: [],
    };
}

export async function deposit(
    web3: Web3, 
    account: string, 
    params: {
        value: BN;
    }
){}

export async function submitTx(
    web3: Web3,
    account: string, 
    params: {
        to: string;
    }
)