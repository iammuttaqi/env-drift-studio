<script setup lang="ts">
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
} from 'radix-vue'
import { cn } from '~/utils/cn'

interface Props {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  side: 'bottom',
  align: 'start',
  contentClass: '',
})
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side="side"
        :align="align"
        :side-offset="6"
        :class="
          cn(
            'z-50 w-72 sm:w-80 rounded-xl border border-[#374151] bg-[#111827] p-4 text-[#f9fafb] shadow-2xl focus:outline-none animate-in fade-in-0 zoom-in-95',
            props.contentClass
          )
        "
      >
        <slot />
        <PopoverArrow class="fill-[#111827] stroke-[#374151]" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
