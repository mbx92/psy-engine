<template>
  <div class="originals-brand-art" aria-hidden="true">
    <div class="art-orbit orbit-one" />
    <div class="art-orbit orbit-two" />
    <div class="art-orbit orbit-three" />
    <div class="art-petal petal-one" />
    <div class="art-petal petal-two" />
    <div class="art-petal petal-three" />
    <div class="art-petal petal-four" />
    <div class="art-center"><OriginalsIcon icon="lucide:sparkles" class="size-7" /></div>
    <span class="art-dot dot-one" />
    <span class="art-dot dot-two" />
  </div>
</template>

<style scoped>
.originals-brand-art { position: relative; width: 100%; aspect-ratio: 1; max-width: 360px; margin: auto; }
.art-orbit { position: absolute; border: 1px solid rgb(224 235 211 / 0.18); border-radius: 50%; }
.orbit-one { inset: 2%; }
.orbit-two { inset: 13%; }
.orbit-three { inset: 25%; }
.art-petal { position: absolute; width: 29%; height: 29%; background: #c7d7a3; }
.petal-one { left: 21%; top: 21%; border-radius: 80% 80% 0 80%; }
.petal-two { right: 21%; top: 21%; border-radius: 80% 80% 80% 0; background: #85aa8d; }
.petal-three { left: 21%; bottom: 21%; border-radius: 80% 0 80% 80%; background: #85aa8d; }
.petal-four { right: 21%; bottom: 21%; border-radius: 0 80% 80% 80%; }
.art-center { position: absolute; inset: 41%; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #244b3c; color: #eff3dd; }
.art-dot { position: absolute; width: 10px; height: 10px; border-radius: 50%; background: #c7d7a3; }
.dot-one { top: 24%; right: 8%; }
.dot-two { bottom: 10%; left: 22%; width: 6px; height: 6px; }
</style>
