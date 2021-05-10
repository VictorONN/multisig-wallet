import React from 'react';
import {Message, Button} from "semantic-ui-react";
import {useWeb3Context} from './contexts/Web3';
import {unlockAccount} from './api/web3';
import useAsync from "./components/useAsync";
import logo from './logo.svg';
import './App.css';

function App() {

  const {
    state: {account}, 
    updateAccount
} = useWeb3Context();

  const {pending, error, call} = useAsync(unlockAccount);

  async function onClickConnect(){
    const {error, data} = await call(null);
    
    if (error) {
      console.error(error);
    }
    if(data){
      //update account
      updateAccount(data)
    }
  }

  return (
    <div className="App">
     <div className="App-header">
       <h1>Multi Sig Wallet</h1>
       <div>Account: {account}</div>
       <Message warning>
         Metamask is not connected
         </Message>
       <Button 
       color="green"
       onClick={()=>onClickConnect()}
       disabled={pending}
       loading={pending}
       >
         Connect to Metamask
       </Button>
     </div>
    </div>
  );
}

export default App;
