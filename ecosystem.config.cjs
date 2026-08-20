module.exports = {
	apps: [
		{
			name: 'pdfmake',
			script: 'dev-playground/server.js',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '512M',
			env: {
				NODE_ENV: 'production',
				HOST: '0.0.0.0',
				PORT: 1234
			}
		}
	]
};
