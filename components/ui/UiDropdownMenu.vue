<script setup lang="ts">
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'radix-vue'
import { cn } from '~/utils/cn'

export interface MenuItem {
  id: string
  label: string
  icon?: any
  danger?: boolean
  disabled?: boolean
  separatorBefore?: boolean
}

interface Props {
  items?: MenuItem[]
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  contentClass: '',
})

const emit = defineEmits<{
  (e: 'select', item: MenuItem): void
}>()
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :side-offset="5"
        :class="
          cn(
            'z-50 min-w-[180px] overflow-hidden rounded-lg border border-[#1f2937] bg-[#111827] p-1 text-[#f9fafb] shadow-xl',
            props.contentClass
          )
        "
      >
        <template v-for="item in items" :key="item.id">
          <DropdownMenuSeparator
            v-if="item.separatorBefore"
            class="my-1 h-px bg-[#1f2937]"
          />
          <DropdownMenuItem
            :disabled="item.disabled"
            :class="
              cn(
                'relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-1.5 text-xs outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 gap-2',
                item.danger
                  ? 'text-[#ef4444] focus:bg-[#4c0519] focus:text-rose-200'
                  : 'text-[#9ca3af] focus:bg-[#1e293b] focus:text-[#f9fafb]'
              )
            "
            @select="emit('select', item)"
          >
            <component :is="item.icon" v-if="item.icon" class="w-3.5 h-3.5" />
            <span>{{ item.label }}</span>
          </DropdownMenuItem>
        </template>
        <slot name="custom-content" />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
