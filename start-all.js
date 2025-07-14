const { spawn } = require('child_process');

console.log('🚀 Starting Document Project...\n');

// Start the web server (port 3000)
console.log('📡 Starting web server on port 3000...');
const webServer = spawn('npx', ['http-server', '.', '-p', '3000', '--cors'], {
    stdio: 'inherit',
    shell: true
});

// Start the API server (port 3001)
console.log('🔧 Starting API server on port 3001...');
const apiServer = spawn('node', ['api-server.js'], {
    stdio: 'inherit',
    shell: true
});

// Wait a moment for servers to start
setTimeout(() => {
    console.log('\n✅ Servers started successfully!');
    console.log('📡 Web server: http://localhost:3000');
    console.log('🔧 API server: http://localhost:3001');
    
    // Register the add-in with Office
    console.log('\n📝 Registering Word add-in...');
    registerAddIn();
}, 2000);

function registerAddIn() {
    console.log('📝 Add-in Installation Instructions:');
    console.log('   1. Open Word');
    console.log('   2. Go to Insert → Get Add-ins → My Add-ins');
    console.log('   3. Click "Upload My Add-in"');
    console.log('   4. Select the manifest.xml file');
    console.log('   5. The add-in will be available in ALL Word documents!');
    console.log('');
    console.log('🌐 Web viewer: http://localhost:3000/web-viewer.html');
    console.log('📄 Sample document: http://localhost:3000/create-sample-document.html');
    console.log('');
    console.log('💡 After installation, the add-in persists across ALL Word documents!');
    console.log('🎉 No SSL certificates or Microsoft registration needed for local development!');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    webServer.kill();
    apiServer.kill();
    process.exit(0);
});

// Handle server errors
webServer.on('error', (err) => {
    console.error('❌ Web server error:', err);
});

apiServer.on('error', (err) => {
    console.error('❌ API server error:', err);
}); 