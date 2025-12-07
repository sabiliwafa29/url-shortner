// Diagnostic: print DATABASE_URL info
console.log('--- DATABASE_URL DIAGNOSTIC ---');
console.log('TYPE:', typeof process.env.DATABASE_URL);
console.log('LENGTH:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
console.log('VALUE:', process.env.DATABASE_URL);
console.log('--- END ---');
