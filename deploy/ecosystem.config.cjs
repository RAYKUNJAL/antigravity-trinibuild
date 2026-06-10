// PM2 ecosystem — keeps TriniBuild backend running, auto-restarts on crash
module.exports = {
  apps: [
    {
      name: 'trinibuild-api',
      script: './server/index.js',
      cwd: '/var/www/trinibuild',
      instances: 2,
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '500M',
      error_file: '/var/log/trinibuild/api-error.log',
      out_file: '/var/log/trinibuild/api-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
