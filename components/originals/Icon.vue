<template>
  <component :is="icons[icon] || Circle" aria-hidden="true" />
</template>

<script setup>
// Bundle the workspace icons locally so navigation is available on first paint.
import {
  ArrowRight, ArrowUpRight, BarChart3, Brain, ChartNoAxesCombined, ChartPie,
  CheckCircle, ChevronRight, Circle, CircleAlert, ClipboardList, FileText,
  Inbox, LayoutDashboard, LogOut, Menu, Moon, PlayCircle, RefreshCw,
  ScrollText, Settings, Sparkles, Sun, Users,
} from 'lucide-vue-next'

defineProps({ icon: { type: String, required: true } })
const icons = {
  'lucide:arrow-right': ArrowRight,
  'lucide:arrow-up-right': ArrowUpRight,
  'lucide:bar-chart-3': BarChart3,
  'lucide:brain': Brain,
  'lucide:chart-no-axes-combined': ChartNoAxesCombined,
  'lucide:chart-pie': ChartPie,
  'lucide:check-circle': CheckCircle,
  'lucide:chevron-right': ChevronRight,
  'lucide:circle-alert': CircleAlert,
  'lucide:clipboard-list': ClipboardList,
  'lucide:file-text': FileText,
  'lucide:inbox': Inbox,
  'lucide:layout-dashboard': LayoutDashboard,
  'lucide:log-out': LogOut,
  'lucide:menu': Menu,
  'lucide:moon': Moon,
  'lucide:play-circle': PlayCircle,
  'lucide:refresh-cw': RefreshCw,
  'lucide:scroll-text': ScrollText,
  'lucide:settings': Settings,
  'lucide:sparkles': Sparkles,
  'lucide:sun': Sun,
  'lucide:users': Users,
}
</script>
