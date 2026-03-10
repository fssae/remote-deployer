import { defineStore } from 'pinia';
import { ref } from 'vue';
import { config } from '../config';

export const useDeployStore = defineStore('deploy', () => {
    const logs = ref([]);
    const isDeploying = ref(false);
    const isConnected = ref(false);

    // 选中的端口和分支
    const selectedPort = ref(config.ports[0]?.value || '8081');
    const selectedBranch = ref(config.branches[0]?.value || 'back_branch');

    let socket = null;

    // Configuration
    const backendUrl = config.backendUrl;
    const apiToken = config.apiToken;

    const addLog = (type, content) => {
        logs.value.push({
            type,
            content,
            time: new Date().toISOString()
        });
    };

    const clearLogs = () => {
        logs.value = [];
    };

    const connectAndDeploy = () => {
        if (isDeploying.value) return;

        isDeploying.value = true;
        clearLogs();
        addLog('system', `准备部署: 端口=${selectedPort.value}, 分支=${selectedBranch.value}`);
        addLog('system', 'Connecting to backend...');

        // Close existing socket if any
        if (socket) {
            socket.close();
        }

        // Connect with port and branch params
        const url = `${backendUrl}?token=${apiToken}&port=${selectedPort.value}&branch=${selectedBranch.value}`;
        socket = new WebSocket(url);

        socket.onopen = () => {
            isConnected.value = true;
            addLog('system', 'Connected. Waiting for output...');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Handle different message types
                if (data.type === 'status' && data.content === 'done') {
                    isDeploying.value = false;
                    addLog('system', 'Deployment process finished.');
                    socket.close(); // Close after done? Or keep open? User req said "exec designated ...", usually implies one-shot.
                    isConnected.value = false;
                    return;
                }

                // Append log
                logs.value.push(data);

            } catch (e) {
                addLog('stdout', event.data); // Fallback for raw text
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket Error:", error);
            addLog('error', 'WebSocket connection error.');
            isDeploying.value = false;
        };

        socket.onclose = () => {
            isConnected.value = false;
            if (isDeploying.value) {
                addLog('system', 'Connection closed unexpectedly.');
                isDeploying.value = false;
            } else {
                addLog('system', 'Connection closed.');
            }
        };
    };

    return {
        logs,
        isDeploying,
        isConnected,
        selectedPort,
        selectedBranch,
        connectAndDeploy,
        clearLogs
    };
});
