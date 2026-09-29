const path = require('node:path');

const root = process.env.BGI_ROOT || 'C:\\BGI_cmd';

function app(environment) {
  const base = path.join(root, environment);
  return {
    name: `bgi-${environment}`,
    cwd: path.join(base, 'current'),
    script: 'dist/src/main.js',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
    time: true,
    out_file: path.join(base, 'logs', 'out.log'),
    error_file: path.join(base, 'logs', 'error.log'),
    env: {
      NODE_ENV: 'production',
      FRONTEND_DIR: 'public',
    },
  };
}

module.exports = {
  apps: [app('staging'), app('prod')],
};
