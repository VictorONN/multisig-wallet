import Web3 from 'web3';
import TruffleContract from '@truffle/contract';
import multiSigWalletTruffle from '../build/contracts/MultiSigWallet.json';
import BN from 'bn.js';
import { callbackify } from 'util';


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
        transactionCount: transactionCount.toNumber(),
        transactions,
    };
}

export async function deposit(
    web3: Web3, 
    account: string, 
    params: {
        value: BN;
    }
){
    MultiSigWallet.setProvider(web3.currentProvider);
    const multiSig = await MultiSigWallet.deployed();

    await multiSig.sendTransaction({
        from: account,
        value: params.value
    })
}

export async function submitTx(
    web3: Web3,
    account: string, 
    params: {
        to: string;
        //NOTE: error when passing BN type, so pass string
        value: string;
        data: string;
    }
){
    const{ to, value, data } = params;

    MultiSigWallet.setProvider(web3.currentProvider);
    const multiSig = await MultiSigWallet.deployed();

    await multiSig.submitTransaction(to, value, data, { from: account,});
}

export async function confirmTx(
    web3: Web3, 
    account: string, 
    params: { txIndex: number;}
){
    const {txIndex} = params;

    MultiSigWallet.setProvider(web3.currentProvider);
    const multiSig = await MultiSigWallet.deployed();

    await multiSig.confirmTransaction(txIndex, { from: account, });
}

export async function revokeConfirmation(
    web3: Web3, 
    account: string,
    params: {
        txIndex: number;
    }
){
    const {txIndex} = params;

    MultiSigWallet.setProvider(web3.currentProvider);
    const multiSig = await MultiSigWallet.deployed();

    await multiSig.revokeConfirmation(txIndex, {
        from: account,
    });
}

export async function executeTx(
    web3: Web3, 
    account: string, 
    params: {
        txIndex: number;
    }
){

}

export function subscribe(
    web3: Web3, 
    address: string, 
    callback: (error: Error | null, log: Log | null) =>  void){
     const multiSig = new web3.eth.Contract(MultiSigWallet.abi, address);

     const res = multiSig.events.allEvents(
         (error: Error, log: Log) => {
            if(error) {
                callback(error, null);
            }else if (log) {
                callback(null, log);
            }
         });

    return () => res.unsubscribe();
}

interface Deposit {
    event: "Deposit";
    returnValues: {
        sender: string;
        amount: string;
        balance: string;
    };
}

interface SubmitTransaction {
    event: "SubmitTransaction";
    returnValues: {
        owner: string;
        txIndex: string;
        to: string;
        value: string;
        data: string;
    };
}

interface ConfirmTransaction {
    event: "ConfirmTransaction";
    returnValues: {
        owner: string;
        txIndex: string;
    };
    }

interface RevokeConfirmation {
    event: "RevokeConfirmation";
    returnValues: {
        owner: string;
        txIndex: string;
    };
}

interface ExecuteTransaction {
    event: "ExecuteTransaction";
    returnValues: {
        owner: string;
        txIndex: string;
    }
}

type Log =
| Deposit
| SubmitTransaction
| ConfirmTransaction
| RevokeConfirmation
| ExecuteTransaction;

