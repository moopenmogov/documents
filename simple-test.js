// Simple test to check API data
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/document-sections',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('API Response Status:', res.statusCode);
            console.log('Number of sections:', json.sections?.length || 0);
            
            if (json.sections && json.sections.length > 0) {
                json.sections.forEach((section, index) => {
                    console.log(`\n--- Section ${index + 1} ---`);
                    console.log('ID:', section.id);
                    console.log('Title:', section.title);
                    console.log('Content count:', section.content?.length || 0);
                    
                    if (section.content) {
                        section.content.forEach((content, i) => {
                            console.log(`Content ${i + 1}:`, content.substring(0, 50) + '...');
                            if (content.includes('<table')) {
                                console.log('  -> HAS TABLE HTML');
                            }
                        });
                    }
                });
            } else {
                console.log('No sections found');
            }
        } catch (error) {
            console.error('Error parsing JSON:', error.message);
            console.log('Raw data:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error.message);
});

req.end(); 