import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000'; // Changed to match backend port

const users = [
  { email: 'admin@example.com', password: 'hashedpassword', role: 'ADMIN' },
  { email: 'provider@example.com', password: 'hashedpassword', role: 'PROVIDER' },
  { email: 'customer@example.com', password: 'hashedpassword', role: 'CUSTOMER' },
];

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const data = await res.json();
  return data.token;
}

async function fetchWithAuth(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json();
}

async function run() {
  for (const user of users) {
    try {
      console.log(`\nLogging in as ${user.role} (${user.email})...`);
      const token = await login(user.email, user.password);
      console.log('  Login successful!');

      // Fetch services
      const services = await fetchWithAuth(`${BASE_URL}/api/services`, token);
      console.log(`  Services: ${services.services?.length || 0}`);
      if (services.services?.length) {
        console.log('    First service:', services.services[0].name, '| Provider:', services.services[0].provider?.name);
      }

      // Fetch bookings (if endpoint exists)
      try {
        const bookings = await fetchWithAuth(`${BASE_URL}/api/bookings`, token);
        console.log(`  Bookings: ${bookings.bookings?.length || 0}`);
      } catch (e) {
        console.log('  Bookings endpoint not available or failed.');
      }

      // Fetch quotes (if endpoint exists)
      try {
        const quotes = await fetchWithAuth(`${BASE_URL}/api/quotes`, token);
        console.log(`  Quotes: ${quotes.quotes?.length || 0}`);
      } catch (e) {
        console.log('  Quotes endpoint not available or failed.');
      }
    } catch (err) {
      console.error('  ERROR:', err.message);
    }
  }
}

run(); 