<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/utils/cn'

interface Props {
  variant?: 'healthy' | 'drift' | 'warning' | 'accent' | 'neutral'
  size?: 'sm' | 'md'
  pulse?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'sm',
  pulse: false,
  class: '',
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'healthy':
      return 'bg-[#064e3b]/80 border-[#065f46] text-[#10b981]'
    case 'drift':
      return 'bg-[#4c0519]/80 border-[#9f1239] text-[#ef4444]'
    case 'warning':
      return 'bg-[#451a03]/80 border-[#92400e] text-[#f59e0b]'
    case 'accent':
      return 'bg-[#0c4a6e]/80 border-[#0284c7] text-[#38bdf8]'
    case 'neutral':
    default:
      return 'bg-[#1e293b] border-[#374151] text-[#9ca3af]'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'md':
      return 'text-xs px-2.5 py-1 gap-1.5'
    case 'sm':
    default:
      return 'text-[11px] px-2 py-0.5 gap-1.5'
  }
})
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center font-medium font-mono border rounded-full tracking-wide tabular-nums select-none transition-colors',
        variantClasses,
        sizeClasses,
        pulse && 'animate-pulse',
        props.class
      )
    "
  >
    <slot name="icon" />
    <slot />
  </span>
</template>
