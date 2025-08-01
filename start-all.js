const { spawn } = require('child_process');

console.log('🚀 Starting Word SuperDoc Add-in...\n');

// Start the web server (port 3000) - serves static files including add-in
console.log('📡 Starting web server on port 3000...');
const webServer = spawn('npx', ['http-server', '.', '-p', '3000', '--cors'], {
    stdio: 'inherit',
    shell: true
});

// Start the API server (port 3001) - handles DOCX processing
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
    
    console.log('\n📝 Word Add-in Installation:');
    console.log('   1. Open Microsoft Word');
    console.log('   2. Go to Insert → Get Add-ins → My Add-ins');
    console.log('   3. Click "Upload My Add-in"');
    console.log('   4. Select the manifest.xml file from this folder');
    console.log('   5. The add-in will appear in your ribbon!');
    console.log('');
    console.log('🌐 Web viewer: http://localhost:3000/viewer.html');
    console.log('💡 Add-in persists across all Word documents once installed');
}, 2000);

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