<template>
  <h1>Prover test</h1>
  <button @click="generateTestProof">Start</button>
</template>

<script>
import { generateTestProof } from '@/utils/prover'

export default {
  methods: {
    async generateTestProof() {
      await generateTestProof()
    }
  }
}
</script>
