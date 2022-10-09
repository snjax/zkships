<template>
  <Modal
    class="size-s"
    v-if="alert.active"
    @close="alert.close()"
  >
    <template #title>{{ alert.title }}</template>
    <template #default>{{ alert.message }}</template>
    <template #controls>
      <span class="btn" @click="alert.close">Ok</span>
    </template>
  </Modal>
</template>

<script setup>
    import Modal from "@/components/UI/Modal";
    import alert from "@/utils/alert";
</script>