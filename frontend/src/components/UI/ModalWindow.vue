<template>
  <div class="modal" @click="close">
    <div class="modal__window" @click.stop>
      <div class="modal__title">
        <div>
          <slot name="title"></slot>
        </div>
        <span class="modal__close" v-show="!props.options.withoutClose" @click="close">
          <svg viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 18L17.5 3M2.5 3L17.5 18" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            </path>
          </svg>
        </span>
      </div>
      <div class="modal__content">
        <slot></slot>
      </div>
      <div class="modal__controls" v-if="$slots.controls">
        <slot name="controls"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, defineEmits, defineProps } from "vue";
import ModalController from "@/components/helpers/ModalController";

const emit = defineEmits(['close'])
const close = () => emit('close')

const props = defineProps({
  options: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

let modalSymbol = null
onMounted(() => {
  modalSymbol = Symbol('modal')
  ModalController.open(modalSymbol)
})

onBeforeUnmount(() => {
  ModalController.close(modalSymbol)
})
</script>
