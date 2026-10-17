<script setup lang="ts">
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from 'radix-vue'
import { cn } from '~/utils/cn'

export interface TabItem {
  id: string
  label: string
  count?: number
  icon?: any
}

interface Props {
  modelValue?: string
  defaultValue?: string
  tabs?: TabItem[]
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  defaultValue: undefined,
  tabs: () => [],
  class: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    :default-value="defaultValue || (tabs.length > 0 ? tabs[0].id : undefined)"
    :class="cn('w-full', props.class)"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <TabsList
      class="inline-flex h-9 items-center justify-start rounded-lg bg-[#0b0f19] p-1 border border-[#1f2937] text-[#9ca3af]"
    >
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.id"
        :value="tab.id"
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-[#0b0f19] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#1e293b] data-[state=active]:text-[#f9fafb] data-[state=active]:shadow-sm gap-2"
      >
        <component :is="tab.icon" v-if="tab.icon" class="w-3.5 h-3.5" />
        <span>{{ tab.label }}</span>
        <span
          v-if="typeof tab.count === 'number'"
          class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#111827] border border-[#1f2937] text-slate-300 tabular-nums"
        >
          {{ tab.count }}
        </span>
      </TabsTrigger>
      <slot name="extra-triggers" />
    </TabsList>

    <div class="mt-4">
      <slot />
      <template v-for="tab in tabs" :key="`content-${tab.id}`">
        <TabsContent :value="tab.id" class="focus:outline-none">
          <slot :name="tab.id" />
        </TabsContent>
      </template>
    </div>
  </TabsRoot>
</template>
