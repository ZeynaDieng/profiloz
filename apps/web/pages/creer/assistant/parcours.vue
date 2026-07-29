<script setup lang="ts">
const route = useRoute()
await navigateTo({ path: '/creer/editeur', query: route.query }, { replace: true })
</script>

<template>
  <div />
</template>
