<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cn } from '~/utils/cn'

interface Props {
  open?: boolean
  title?: string
  description?: string
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  title: '',
  description: '',
  contentClass: '',
})

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()
</script>

<template>
  <DialogRoot :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity" />
      <DialogContent
        :class="
          cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#1f2937] bg-[#111827] p-6 shadow-2xl focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/50',
            props.contentClass
          )
        "
      >
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="space-y-1">
            <DialogTitle v-if="title" class="text-base font-semibold text-[#f9fafb]">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="text-xs text-[#9ca3af]">
              {{ description }}
            </DialogDescription>
          </div>

          <DialogClose
            class="rounded-md p-1.5 text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
          >
            <X class="w-4 h-4" />
          </DialogClose>
        </div>

        <slot />

        <div v-if="$slots.footer" class="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
