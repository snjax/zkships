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
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia'
import { useCryptoStore } from "@/stores/crypto";
import { useRouter } from 'vue-router'

const { connect } = useCryptoStore()
const { networks, wallets } = storeToRefs(useCryptoStore())
const selectedNetwork = ref(null)
const selectedWallet = ref(null)
const networkAssets = '/img/connect/'
const submitAvailable = computed(() => selectedNetwork.value && selectedWallet.value)

const isConnecting = ref(false)
const router = useRouter()

function setNetwork(network) {
  selectedNetwork.value = network
}

function setWallet(wallet) {
  selectedWallet.value = wallet
}

async function submit() {
  try {
    isConnecting.value = true
    await connect(selectedNetwork.value, selectedWallet.value)
  }
  catch (e) {
    console.error(e);
  }
  finally {
    isConnecting.value = false
    await router.push({ path: '/lobby' })
  }
}
</script>
