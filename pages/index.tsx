import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import abi from '../utils/bullionstandard.json'
import React from 'react'
import ethers, { BigNumber, providers } from 'ethers'
import qs from 'qs'
import Select from 'react-select'
import Big from 'big.js'

const Home: NextPage = () => {
  const contractAddress = "0x07683D70D3752AF5c9598d0124b2Fc6c9D94fc03";
  const [wallet, setWallet] = React.useState();
  const [connected, setConnected] = React.useState();
  const [account, setAccount] = React.useState();
  const [amount, setAmount] = React.useState<string>();
  const [isSelling, setIsSelling] = React.useState<boolean>();
  const [buyToken, setBuyToken] = React.useState<string>('DAI');
  const [sellToken, setSellToken] = React.useState<string>('ETH');
  const [provider, setProvider] = React.useState<providers.Web3Provider>();
  const [quotedAmount, setQuotedAmount] = React.useState<string>('');
  const [errors, setError] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [quoted, setQuoted] = React.useState<string>('');
  const swappable = [
    { value: 'ETH', label: 'ETH' },
    { value: 'DAI', label: 'DAI' },
    { value: 'USDC', label: 'USDC' }
  ]
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        setError('Wallet required')
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setAccount(accounts[0]);
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      setProvider(provider);
    } catch (e) {
      setError('Failed to connect wallet');
    }
  }

  const quote = async () => {
    console.log('quote params', buyToken, sellToken, amount);
    if (!buyToken || !sellToken || !amount || new Big(amount).eq(0)) {
      return;
    }
    console.log(1)
    let params;
    if (!isSelling) {
      params = {
        sellToken,
        buyToken,
        buyAmount: new Big(amount).toString()
      }

    } else {
      params = {
        sellToken,
        buyToken,
        sellAmount: new Big(amount).toString()
      }
    }

    if (params) {
      const url = `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`;
      const response = await fetch(
        `https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`
      );
      setQuoted(await response.json())
    }
  }


  const executeSwap = async () => {
    if (!buyToken || !sellToken) {
      setError('Please provide a buy/sell token symbol');
      return;
    }

    if (!amount || new Big(amount).eq(0)) {
      setError('Please provide an amount')
      return
    }

    if (!provider) {
      setError('Need to connect to the blockchain')
      return;
    }

    const signer = provider.getSigner();
    const takerAddress = await signer.getAddress();

    let params;
    const value = new Big(amount).toString()
    if (!isSelling) {
      params = {
        sellToken,
        buyToken,
        takerAddress,
        buyAmount: value
      }

    } else {
      params = {
        sellToken,
        buyToken,
        takerAddress,
        sellAmount: value
      }
    }
  }

  React.useEffect(() => {
    quote();
  }, [amount]);

  return (
    <div className={styles.container}>
      <Head>
        <title>BS Swaps</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Bullion Standard
        </h1>
        <p className={styles.description}>
          BS Swaps
        </p>
        {errors && <p>{errors}</p>}
        {quoted && <p>{quoted}</p>}
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>In</h2>
            <Select options={swappable} onChange={(options) => setBuyToken(options.value)} />
          </div>
          <div className={styles.card}>
            <h2>Out</h2>
            <Select options={swappable} onChange={(options) => setSellToken(options.value)} />
          </div>
          <div className={styles.card}>
            <h2>Amount to Swap</h2>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home