<script setup lang="ts">
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from 'radix-vue'
import { cn } from '~/utils/cn'

interface Props {
  text?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  side: 'top',
  align: 'center',
  delayDuration: 150,
  contentClass: '',
})
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side"
          :align="align"
          :side-offset="5"
          :class="
            cn(
              'z-50 overflow-hidden rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1.5 text-xs text-[#f9fafb] shadow-md animate-in fade-in-0 zoom-in-95',
              props.contentClass
            )
          "
        >
          <slot name="content">
            {{ text }}
          </slot>
          <TooltipArrow class="fill-[#111827] stroke-[#374151]" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
