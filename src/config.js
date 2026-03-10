export const config = {
    // 后端服务器公网地址
    backendUrl: "ws://82.156.64.69:8083/ws/deploy",

    // 必须与后端 config.yaml 中的 api_token 一致
    apiToken: "your-secret-token",

    // 可选端口列表
    ports: [
        { value: "8081", label: "8081 (生产)" },
        { value: "8082", label: "8082 (测试)" },
        { value: "8083", label: "8083 (开发)" },
    ],

    // 可选分支列表
    branches: [
        { value: "back_branch", label: "back_branch (后端主分支)" },
        { value: "main", label: "main (主分支)" },
        { value: "dev", label: "dev (开发分支)" },
        { value: "test", label: "test (测试分支)" },
    ]
};
