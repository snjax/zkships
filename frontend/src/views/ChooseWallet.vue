<template>
  <ModalWindow class="wallet" :options="{withoutClose: true}" @close="close">
    <template #title>Connect to wallet</template>
    <template #default>
      <div class="wallet__step">
        <div class="wallet__step-title">
          <div>Step 1</div>
          <div>Choose Network</div>
        </div>
        <div class="wallet__step-items">
          <div v-for="option in networks" :key="option.key"
            :class="{'selected': selectedNetwork === option.key, 'na': !option.available}"
            @click="option.available? setNetwork(option.key) : null">
            <div>
              <img alt="" :src="networkAssets+'network/'+option.key+'.svg'" />
            </div>
            <div>{{ option.name }}</div>
            <svg viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11.75" cy="11.75" r="10.25" stroke-width="2" />
              <path d="M7.375 12.375L9.875 14.875L16.125 8.625" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <div class="wallet__step">
        <div class="wallet__step-title">
          <div>Step 2</div>
          <div>Choose Wallet</div>
        </div>
        <div class="wallet__step-items">
          <div v-for="option in wallets" :key="option.key"
            :class="{'selected': selectedWallet === option.key, 'na': !option.available}"
            @click="option.available? setWallet(option.key) : null">
            <div :style="{'background':option.color}">
              <img alt="" :src="networkAssets+'wallet/'+option.key+'.svg'" />
            </div>
            <div>{{ option.name }}</div>
            <svg viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11.75" cy="11.75" r="10.25" stroke-width="2" />
              <path d="M7.375 12.375L9.875 14.875L16.125 8.625" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <LoaderElement v-if="isConnecting" class="absolute with-bg">Connecting...</LoaderElement>
    </template>
    <template #controls>
      <span class="btn" :class="{na: !submitAvailable}" @click="submitAvailable? submit() : null">Connect</span>
    </template>
  </ModalWindow>
</template>

<script setup>
import ModalWindow from '@/components/UI/ModalWindow'
import LoaderElement from '@/components/UI/LoaderIndicator'
// import { useWalletConnection } from "@/components/helpers/WalletConnect";
import { ref } from "vue";
// import AppConnector from '@/crypto/AppConnector'
// import { Ethereum } from '@/crypto/helpers'

// const {
//   isOpen,
//   networks,
//   wallets,
//   selectedNetwork,
//   selectedWallet,
//   networkAssets,
//   close,
//   setNetwork,
//   setWallet,
//   submitAvailable
// } = useWalletConnection()

const isConnecting = ref(false)

const submit = async () => {
  // try {
  //   AppConnector.init(Ethereum.ConnectorTypes.RARIBLE)
  //     .then(({ connector }) => {
  //       connector.isUserConnected()
  //         .then(() => {
  //           afterConnect()
  //         })
  //         .catch(() => {
  //           console.log(connector, 'connector1')
  //           // console.log('user not connected')
  //           let walletValue = ''
  //           if (selectedWallet.value === '1inch' && connector.checkInchInjected()) walletValue = 'Metamask'
  //           else walletValue = (selectedWallet.value === '1inch') ? 'walletconnect' : selectedWallet.value
  //           connector.connectToWallet(walletValue)
  //             .then(() => {
  //               afterConnect()
  //             })
  //             .catch(e => {
  //               console.log(`Error connecting to ${selectedWallet.value} `, e)
  //             })
  //         })
  //     })
  // }
  // catch (e) {
  //   console.log(e);
  // }
  // finally {
  //   isConnecting.value = false
  // }
}
</script>
