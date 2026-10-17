<script setup lang="ts">
import { cn } from '~/utils/cn'

interface Props {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
})
</script>

<template>
  <div
    :class="
      cn(
        'animate-pulse rounded-md bg-gradient-to-r from-[#111827] via-[#1e293b] to-[#111827] bg-[length:200%_100%]',
        props.class
      )
    "
  />
</template>
