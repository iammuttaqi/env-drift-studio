<script setup lang="ts">
import { cn } from '~/utils/cn'

interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  class: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', event: Event): void
}>()
</script>

<template>
  <div class="relative flex items-center w-full">
    <div v-if="$slots.prefix" class="absolute left-2.5 text-[#9ca3af] pointer-events-none flex items-center">
      <slot name="prefix" />
    </div>

    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="
        cn(
          'w-full h-8 sm:h-9 rounded-md border border-[#1f2937] bg-[#0b0f19] px-3 py-1.5 text-xs text-[#f9fafb] placeholder:text-[#6b7280] font-mono transition-colors focus:border-[#374151] focus:outline-none focus:ring-1 focus:ring-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed',
          $slots.prefix && 'pl-8',
          $slots.suffix && 'pr-8',
          props.class
        )
      "
      @input="(e) => emit('update:modelValue', (e.target as HTMLInputElement).value)"
      @change="(e) => emit('change', e)"
    />

    <div v-if="$slots.suffix" class="absolute right-2.5 text-[#9ca3af] flex items-center">
      <slot name="suffix" />
    </div>
  </div>
</template>
