<template>
  <!-- 书房主路由：空 view —— 让 StudyShell 在背景层渲染 6 件器物 -->
  <div class="study-view" aria-hidden="true"></div>
</template>

<style scoped>
.study-view { width: 100%; height: 100%; min-height: calc(100vh - 96px); }
</style>
