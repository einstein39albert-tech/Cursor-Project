module.exports = {
  apps: [
    {
      name: "uorms",
      script: "src/server.js",
      cwd: "/var/www/uorms",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "500M",
      error_file: "/var/log/uorms/error.log",
      out_file: "/var/log/uorms/out.log",
      time: true,
    },
  ],
};
