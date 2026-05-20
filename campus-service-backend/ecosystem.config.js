module.exports = {
  apps: [
    {
      name: 'resolvehub-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        APP_BASE_PATH: '/apartment',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        APP_BASE_PATH: '/apartment',
        PORT: 5000
      }
    }
  ]
};
