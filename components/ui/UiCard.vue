<script setup lang="ts">
import { cn } from '~/utils/cn'

interface Props {
  class?: string
  elevated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  elevated: false,
})
</script>

<template>
  <div
    :class="
      cn(
        'rounded-xl border border-[#1f2937] bg-[#111827] text-[#f9fafb] transition-all',
        elevated ? 'shadow-xl shadow-black/40 border-[#374151]' : 'shadow-sm',
        props.class
      )
    "
  >
    <div v-if="$slots.header" class="px-5 py-4 border-b border-[#1f2937]">
      <slot name="header" />
    </div>

    <div class="p-5">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-5 py-3 border-t border-[#1f2937] bg-[#0d131f]/50 rounded-b-xl">
      <slot name="footer" />
    </div>
  </div>
</template>
