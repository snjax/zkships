import { ref, computed } from 'vue'
import { ethers } from 'ethers'
import { defineStore } from 'pinia'
import WalletConnectProvider from '@walletconnect/web3-provider'
import { ZkShipsContract } from '@/utils/contract'

export const ChainId = {
  ETHEREUM: 1,
  GOERLI: 5,
  POLYGON: 137,
  POLYGON_TESTNET: 80001,
}

export const Backend = {
  WALLETCONNECT: 'WALLETCONNECT',
  METAMASK: 'METAMASK',
}

const CHAIN_RPCS = {
  [ChainId.POLYGON]: 'https://polygon-rpc.com',
  [ChainId.POLYGON_TESTNET]: 'https://rpc-mumbai.matic.today',
  [ChainId.GOERLI]: 'https://rpc.goerli.mudit.blog',
}

const AVAILABLE_NETWORKS = [
  {id: ChainId.GOERLI, name: 'Ethereum', key: 'ether', color: '#627EEA', available: true},
  {id: ChainId.POLYGON_TESTNET, name: 'Polygon', key: 'matic', color: '#627EEA', available: true},
]

const AVAILABLE_WALLETS = [
  {id: 1, name: 'MetaMask', key: 'Metamask', color: '#627EEA', available: true},
  {id: 3, name: 'WalletConnect', key: 'walletconnect', color: '#D9ECFF', available: true},
]

export const useCryptoStore = defineStore('account', () => {
  const wallet = ref(null)
  const contract = ref(null)
  const networks = computed(() => AVAILABLE_NETWORKS)
  const wallets = computed(() => AVAILABLE_WALLETS)

  function resetState() {
    wallet.value = null
  }

  async function connect(backend, chainId) {
    if (!CHAIN_RPCS[chainId]) {
      throw new Error('Unsupported chain')
    }

    let web3
    let provider
    let account
    if (backend === Backend.WALLETCONNECT) {
      provider = new WalletConnectProvider(CHAIN_RPCS)
      account = await provider.enable()[0]
    } else if (backend === Backend.METAMASK) {
      const { ethereum } = window
      if (ethereum) {
        provider = ethereum
        account = (await ethereum.request('eth_requestAccounts'))[0]
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainId }]
        });
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

    contract.value = new ZkShipsContract(process.env.VUE_APP_CONTRACT_ADDRESS, wallet.value.web3.getSigner())
  }

  return { connect, wallet, contract, networks, wallets }
})
