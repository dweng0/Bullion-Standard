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
  const [title, setTitle] = React.useState<string>('Bullion Standard')
  const [errors, setError] = React.useState<string>('');
  const [slip, setSlip] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [quoted, setQuoted] = React.useState<string>('');


  const convertWithDecimals = (decimals = 18, convertTo = true) => {
    const BASE = 10;
    return (value: string) => {
      return convertTo ?
        new Big(value).mul(new Big(BASE).pow(Number(decimals) || 18)).toString()
        : new Big(value).div(new Big(BASE).pow(Number(decimals) || 18)).toString()
    }
  }

  const convertTo = (value: string, decimals: number) => convertWithDecimals(decimals, true)(value)
  const convertFrom = (value: string, decimals: number) => convertWithDecimals(decimals, false)(value)

  const swappable = [
    { value: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6', label: 'ETH' },
    { value: '0xdc31ee1784292379fbb2964b3b9c4124d8f89c60', label: 'DAI' },
    { value: '0x07865c6e87b9f70255377e024ace6630c1eaa37f', label: 'USDC' },
    { value: '0x45cd94330ac3aea42cc21cf9315b745e27e768bd', label: 'GSB' },
    { value: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c', label: 'ZRX' }
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
    setTitle('Bullion Standard')
    setLoading(true);
    if (!buyToken || !sellToken || !amount || new Big(amount).eq(0)) {
      setLoading(false);
      return;
    }
    const baseAmount = convertTo(amount, 18)

    let params;
    if (!isSelling) {
      params = {
        sellToken,
        buyToken,
        buyAmount: baseAmount
      }

    } else {
      params = {
        sellToken,
        buyToken,
        sellAmount: baseAmount
      }
    }

    if (params) {
      try {
        const url = `https://goerli.api.0x.org/swap/v1/price?${qs.stringify(params)}`;
        const response = await fetch(url);
        const resp = await response.json();
        console.log(resp)
        if (resp) {
          const price = new Big(convertFrom(resp.buyAmount, 18)).toFixed(6)
          setQuoted(price)
          if (resp.expectedSlippage) {
            setSlip(new Big(resp.expectedSlippage).toFixed(4))
          }
          setTitle(`Bullion Price ${price}`)
        }
      } catch (e) {

        if (e && e.validationErrors?.length && e.validationErrors[0]?.reason) {
          setError(`Failed to quote a price: ${e.validationErrors[0].reason}`)
        } else {
          setError('Failed to quote a price');
        }
      } finally {
        setLoading(false)
      }


      setLoading(false)
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

  const showLoading = () => {
    if (quoted) {
      return
    }
    if (loading) {
      return <div><span className="loader loader-circles"></span>Loading...</div>
    }
  }

  React.useEffect(() => {
    setError('');
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
          {title}
        </h1>
        <p className={styles.description}>
          BS Swaps
        </p>
        {errors && <p>{errors}</p>}
        {showLoading()}
        {slip && <p>slippage {slip}</p>}
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Sell</h2>
            <Select options={swappable} onChange={(options) => setSellToken(options.value)} />
          </div>
          <div className={styles.card}>
            <h2>Buy</h2>
            <Select options={swappable} onChange={(options) => setBuyToken(options.value)} />
          </div>
          <div className={styles.card}>
            <h2>Amount to Swap</h2>
            <input className={styles.inputNumber} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
