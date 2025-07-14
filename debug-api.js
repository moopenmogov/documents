const fetch = require('node-fetch');

async function debugAPI() {
    try {
        console.log('🔍 Debugging API data...\n');
        
        // Get the current document sections
        const response = await fetch('http://localhost:3001/api/document-sections');
        
        if (!response.ok) {
            console.error('❌ API request failed:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('📊 Current API data:');
        console.log('Number of sections:', data.sections?.length || 0);
        
        if (data.sections && data.sections.length > 0) {
            data.sections.forEach((section, index) => {
                console.log(`\n📋 Section ${index + 1}:`);
                console.log('  ID:', section.id);
                console.log('  Title:', section.title);
                console.log('  Content items:', section.content?.length || 0);
                
                if (section.content && section.content.length > 0) {
                    section.content.forEach((content, contentIndex) => {
                        console.log(`  Content ${contentIndex + 1}:`, content.substring(0, 100) + (content.length > 100 ? '...' : ''));
                        
                        // Check if it contains table HTML
                        if (content.includes('<table') || content.includes('<tr') || content.includes('<td')) {
                            console.log('    ✅ Contains table HTML!');
                        } else if (content.includes('\t') || content.includes('|')) {
                            console.log('    ⚠️ Contains table-like formatting but no HTML');
                        } else {
                            console.log('    📝 Plain text content');
                        }
                    });
                }
            });
        } else {
            console.log('❌ No sections found');
        }
        
    } catch (error) {
        console.error('❌ Error debugging API:', error.message);
    }
}

debugAPI(); 