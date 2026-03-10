<template>
  <div class="flex flex-col h-screen bg-gray-900 text-white font-sans">
    <!-- Header / Status Bar -->
    <div class="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
      <h1 class="text-xl font-bold tracking-wide text-blue-400">Remote Deployer</h1>
      <div class="flex items-center space-x-3">
        <span 
          class="w-3 h-3 rounded-full transition-colors duration-500"
          :class="statusColor"
        ></span>
        <span class="text-sm text-gray-300">{{ deploymentStatus }}</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-4 lg:p-8 flex flex-col justify-center items-center">
      
      <!-- Action Card -->
      <div class="w-full max-w-2xl bg-gray-800 rounded-xl p-6 shadow-2xl mb-6">
        <p class="text-gray-400 mb-4 text-center">
          Target Server: 82.156.64.69
        </p>
        
        <!-- 参数选择区域 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <!-- 端口选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">端口号</label>
            <select 
              v-model="store.selectedPort"
              :disabled="isDeploying"
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option v-for="port in ports" :key="port.value" :value="port.value">
                {{ port.label }}
              </option>
            </select>
          </div>
          
          <!-- 分支选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Git 分支</label>
            <select 
              v-model="store.selectedBranch"
              :disabled="isDeploying"
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option v-for="branch in branches" :key="branch.value" :value="branch.value">
                {{ branch.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 部署按钮 -->
        <button
          @click="startDeploy"
          :disabled="isDeploying"
          class="w-full px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          :class="isDeploying ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500'"
        >
          <span v-if="isDeploying" class="flex items-center justify-center">
             <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
               <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             Deploying...
          </span>
          <span v-else>🚀 开始部署</span>
        </button>
      </div>

      <!-- Terminal Output -->
      <div class="w-full max-w-4xl flex-1 bg-black rounded-lg border border-gray-700 shadow-inner overflow-hidden flex flex-col">
        <div class="bg-gray-800 px-4 py-2 text-xs text-gray-400 flex justify-between">
          <span>CONSOLE OUTPUT</span>
          <button @click="clearLogs" class="hover:text-white">Clear</button>
        </div>
        <div ref="terminalRef" class="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed space-y-1">
          <div v-if="logs.length === 0" class="text-gray-600 italic">Ready for deployment...</div>
          <div 
            v-for="(log, index) in logs" 
            :key="index" 
            :class="getLogClass(log.type)"
            class="break-words whitespace-pre-wrap"
          >
            <span class="text-gray-500 text-xs mr-2">[{{ formatTime(log.time) }}]</span>
            <span>{{ log.content }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useDeployStore } from '../stores/deployStore';
import { config } from '../config';

const store = useDeployStore();
const terminalRef = ref(null);

// 端口和分支选项列表
const ports = config.ports;
const branches = config.branches;

// Expose state from store
const logs = computed(() => store.logs);
const isDeploying = computed(() => store.isDeploying);
const isConnected = computed(() => store.isConnected);

const statusColor = computed(() => {
  if (isDeploying.value) return 'bg-yellow-400 animate-pulse';
  if (isConnected.value) return 'bg-green-500';
  return 'bg-gray-500';
});

const deploymentStatus = computed(() => {
  if (isDeploying.value) return 'Deploying...';
  if (isConnected.value) return 'Online'; // Connected via WS or just Backend reachable
  return 'Idle';
});

const startDeploy = () => {
  store.connectAndDeploy();
};

const clearLogs = () => {
  store.clearLogs();
};

// Auto-scroll terminal
watch(logs, async () => {
  await nextTick();
  if (terminalRef.value) {
    terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
  }
}, { deep: true });

const getLogClass = (type) => {
  switch (type) {
    case 'stderr': return 'text-red-400';
    case 'system': return 'text-blue-400 font-bold';
    case 'error': return 'text-red-500 font-bold bg-red-900/20 p-1 rounded';
    case 'status': return 'text-green-400';
    default: return 'text-gray-300'; // stdout
  }
};

const formatTime = (isoTime) => {
  if (!isoTime) return '';
  const date = new Date(isoTime);
  return date.toLocaleTimeString([], { hour12: false });
};
</script>

<style scoped>
/* Custom scrollbar for terminal feel */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #1a202c; 
}
::-webkit-scrollbar-thumb {
  background: #4a5568; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #718096; 
}
</style>
