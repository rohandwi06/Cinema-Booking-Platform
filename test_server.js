console.log('Starting test...');

try {
    console.log('Loading app.js...');
    require('./src/app.js');
    console.log('App loaded successfully');
} catch (error) {
    console.error('Error loading app:', error.message);
    console.error('Stack:', error.stack);
} 