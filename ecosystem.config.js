module.exports = {
  apps: [
    {
      name: 'quankey-backend',
      script: './backend/dist/server.js',
      cwd: '/home/ubuntu/quankey-mvp',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 30000,
      health_check_interval: 30000,
      
      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Performance monitoring
      pmx: true,
      
      // Source map support
      source_map_support: true,
      
      // Environment variables for backend
      env_file: './backend/.env'
    },
    
    {
      name: 'quankey-frontend',
      script: 'npx',
      args: 'serve -s build -l 3000',
      cwd: '/home/ubuntu/quankey-mvp/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 30000,
      health_check_interval: 30000,
      
      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Performance monitoring
      pmx: true
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['quankey.xyz'],
      ref: 'origin/main',
      repo: 'https://github.com/JCQuankey/quankey-mvp.git',
      path: '/home/ubuntu/quankey-mvp',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update -y; apt install git -y'
    },
    
    staging: {
      user: 'ubuntu',
      host: ['staging.quankey.xyz'],
      ref: 'origin/develop',
      repo: 'https://github.com/JCQuankey/quankey-mvp.git',
      path: '/home/ubuntu/quankey-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'apt update -y; apt install git -y',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};