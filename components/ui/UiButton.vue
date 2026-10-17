<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { cn } from '~/utils/cn'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'sm',
  disabled: false,
  loading: false,
  type: 'button',
  class: '',
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const baseClasses =
  'inline-flex items-center justify-center font-medium transition-all rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0b0f19] disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]'

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-sky-500 text-slate-950 hover:bg-sky-400 font-semibold shadow-sm shadow-sky-950/50'
    case 'outline':
      return 'border border-[#1f2937] bg-[#111827] text-[#f9fafb] hover:bg-[#1e293b] hover:border-[#374151]'
    case 'ghost':
      return 'text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1e293b]'
    case 'danger':
      return 'bg-[#4c0519] border border-[#9f1239] text-[#ef4444] hover:bg-[#881337] hover:text-white'
    case 'secondary':
    default:
      return 'bg-[#1e293b] border border-[#374151] text-[#f9fafb] hover:bg-[#334155]'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'text-xs px-2 py-1 gap-1.5'
    case 'sm':
      return 'text-xs px-2.5 py-1.5 gap-2'
    case 'lg':
      return 'text-sm px-4 py-2.5 gap-2.5'
    case 'md':
    default:
      return 'text-xs sm:text-sm px-3 py-2 gap-2'
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="cn(baseClasses, variantClasses, sizeClasses, props.class)"
    @click="(e) => emit('click', e)"
  >
    <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin text-current" />
    <slot name="icon" v-else />
    <slot />
  </button>
</template>
