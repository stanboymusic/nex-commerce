const http = require('http');

const ADMIN_EMAIL = 'nexcommerce9@gmail.com';
const ADMIN_PASSWORD = '31671702!!';
const POCKETBASE_URL = 'http://127.0.0.1:8090';

async function createAdminUser() {
  const data = JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    passwordConfirm: ADMIN_PASSWORD
  });

  const options = {
    hostname: '127.0.0.1',
    port: 8090,
    path: '/api/admins',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Admin user created successfully!');
          console.log(`📧 Email: ${ADMIN_EMAIL}`);
          console.log(`🔐 Password: ${ADMIN_PASSWORD}`);
          console.log(`🌐 Admin Panel: ${POCKETBASE_URL}/_/`);
          resolve(responseData);
        } else if (res.statusCode === 400) {
          console.log('ℹ️  Admin user already exists or validation error');
          console.log(`📧 Email: ${ADMIN_EMAIL}`);
          console.log(`🌐 Admin Panel: ${POCKETBASE_URL}/_/`);
          resolve(responseData);
        } else {
          reject(new Error(`Failed to create admin: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error connecting to PocketBase:', error.message);
      console.log('💡 Make sure PocketBase is running on http://127.0.0.1:8090');
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Wait a bit for PocketBase to start, then create admin
setTimeout(async () => {
  try {
    await createAdminUser();
  } catch (error) {
    console.error('Failed to create admin user:', error.message);
    process.exit(1);
  }
}, 2000);
