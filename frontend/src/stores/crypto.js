import { ref } from 'vue'
import { ethers } from 'ethers'
import { defineStore } from 'pinia'
import WalletConnectProvider from '@walletconnect/web3-provider'

const CHAINS = {
  137: 'https://polygon-rpc.com',
  80001: 'https://rpc-mumbai.matic.today',
}

export const useCryptoStore = defineStore('account', () => {
  const wallet = ref(null)

  function resetState() {
    wallet.value = null
  }

  async function initWallet(backend, chainId) {
    if (!CHAINS[chainId]) {
      throw new Error('Unsupported chain')
    }

    let web3
    let provider
    let account
    if (backend === 'walletconnect') {
      provider = new WalletConnectProvider(CHAINS)
      account = await provider.enable()[0]
    } else if (backend === 'metamask') {
      const { ethereum } = window
      if (ethereum) {
        provider = ethereum
        account = (await ethereum.request('eth_requestAccounts'))[0]
        // await provider.request({
        //   method: "wallet_switchEthereumChain",
        //   params: [{ chainId: chainId }]
        // });
      } else {
        throw new Error('Metamask not installed')
      }
    } else {
      throw new Error(`Unknown backend ${backend}`)
    }

    provider.on('accountsChanged', (accounts) => {
      console.log('accountsChanged', accounts)
      resetState()
    })

    provider.on('chainChanged', (chainId) => {
      console.log('chainChanged', chainId)
      resetState()
    })

    provider.on('disconnect', (code, reason) => {
      console.log('WalletConnect disconnected', code, reason)
      resetState()
    });

    web3 = new ethers.providers.Web3Provider(provider)

    wallet.value = {
      web3,
      account,
      chainId,
    }
  }

  return { initWallet, wallet }
})
