// Simple test function
window.testModeToggle = function() {
    console.log('Testing mode toggle...');
    const role = getCurrentUserRole();
    const toolbar = document.querySelector('#superdoc-toolbar');
    console.log('Role:', role);
    console.log('Toolbar:', toolbar);
    if (toolbar) {
        console.log('Toolbar content:', toolbar.innerHTML);
    }
    return { role, toolbar: !!toolbar };
};
