<template>
  <span class="theme-preview" :class="`preview-${theme}`" aria-hidden="true">
    <span class="preview-nav"><span class="preview-logo" /><span v-for="line in 4" :key="line" class="preview-nav-line" /></span>
    <span class="preview-content">
      <span class="preview-heading" />
      <span class="preview-subheading" />
      <span v-if="theme === 'originals'" class="preview-banner"><span /><span /></span>
      <span class="preview-cards"><span v-for="card in 3" :key="card"><i /><b /></span></span>
      <span class="preview-panel"><span /><span /><span /></span>
    </span>
  </span>
</template>

<script setup>
defineProps({ theme: { type: String, required: true } })
</script>

<style scoped>
.theme-preview { --preview-bg: #f7f8fa; --preview-card: #fff; --preview-ink: #171717; --preview-muted: #dfe3e8; --preview-primary: #171717; --preview-radius: 7px; display: flex; flex-direction: column; height: 142px; overflow: hidden; border: 1px solid var(--preview-muted); border-radius: 9px; background: var(--preview-bg); }
.preview-nav { display: flex; height: 22px; align-items: center; gap: 6px; padding: 6px 9px; border-bottom: 1px solid var(--preview-muted); background: var(--preview-card); }
.preview-logo { width: 9px; height: 9px; border-radius: 3px; background: var(--preview-primary); }
.preview-nav-line { height: 3px; width: 18px; border-radius: 2px; background: var(--preview-muted); }
.preview-content { display: block; flex: 1; min-width: 0; padding: 13px; }
.preview-heading { display: block; width: 43%; height: 5px; border-radius: 2px; background: var(--preview-ink); }
.preview-subheading { display: block; width: 60%; height: 3px; margin-top: 5px; background: var(--preview-muted); }
.preview-cards { display: flex; gap: 5px; margin-top: 10px; }
.preview-cards > span { flex: 1; padding: 6px; background: var(--preview-card); border: 1px solid var(--preview-muted); border-radius: var(--preview-radius); }
.preview-cards i { display: block; width: 60%; height: 3px; background: var(--preview-muted); }
.preview-cards b { display: block; width: 25%; height: 7px; margin-top: 4px; border-radius: 1px; background: var(--preview-primary); }
.preview-panel { display: flex; gap: 8px; margin-top: 8px; padding: 8px; border: 1px solid var(--preview-muted); border-radius: var(--preview-radius); background: var(--preview-card); }
.preview-panel > span { width: 24%; height: 3px; background: var(--preview-muted); }
.preview-ibm { --preview-bg: #f4f4f4; --preview-primary: #0f62fe; --preview-radius: 0px; }
.preview-ibm .preview-nav { background: #161616; }
.preview-originals { --preview-bg: #f7f6f2; --preview-primary: #2b604d; --preview-muted: #dce2da; flex-direction: row; }
.preview-originals .preview-nav { flex-direction: column; align-items: flex-start; gap: 10px; width: 39px; height: auto; padding: 13px 8px; background: #20382f; }
.preview-originals .preview-logo { background: #c7d7a3; }
.preview-originals .preview-nav-line { background: #729381; }
.preview-banner { display: flex; align-items: center; justify-content: space-between; margin-top: 9px; padding: 7px; border-radius: 5px; background: #e4ecdf; }
.preview-banner > span:first-child { height: 4px; width: 45%; background: #729381; }
.preview-banner > span:last-child { width: 14px; height: 14px; border-radius: 50% 50% 0 50%; background: #729381; }
.preview-originals .preview-cards { margin-top: 6px; }
.preview-originals .preview-panel { margin-top: 6px; padding: 5px; }
</style>
