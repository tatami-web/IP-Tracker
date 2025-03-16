const CACHE_KEY = 'ipDataCache';
const CACHE_EXPIRATION = 3600000; // 1 hour in milliseconds
const LAST_IP_KEY = 'lastIP';
let refreshCooldown = false;

async function fetchIPData() {
  try {
    const response = await fetch('https://api4.ipify.org?format=json');
    if (!response.ok) throw new Error('Network response was not ok');
    const { ip } = await response.json();

    const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!geoResponse.ok) throw new Error('Geo data fetch failed');
    const data = await geoResponse.json();

    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  } catch (error) {
    document.getElementById('error').textContent = 'Error fetching IP data.';
    throw error;
  }
}

function getCachedData() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_EXPIRATION) {
      return data;
    }
  }
  return null;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const copyButton = document.getElementById('copy-btn');
    const message = document.getElementById('custom-message');

    copyButton.classList.add('copied');
    message.style.opacity = 1;

    setTimeout(() => {
      copyButton.classList.remove('copied');
      message.style.opacity = 0;
    }, 1500);
  }).catch(err => {
    console.error('Could not copy text:', err);
  });
}

async function displayIPAndFlag(forceRefresh = true) {
  const spinner = document.getElementById('spinner');
  spinner.style.display = 'block';

  let data;
  try {
    if (forceRefresh) {
      data = await fetchIPData();
    } else {
      data = getCachedData() || await fetchIPData();
    }

    if (data) {
      const ip = data.ip;
      const lastIP = localStorage.getItem(LAST_IP_KEY);

      // Comprueba si la IP ha cambiado
      if (ip !== lastIP) {
        localStorage.setItem(LAST_IP_KEY, ip);
        document.getElementById('ip').textContent = `IP: ${ip}`;
        document.getElementById('country').textContent = `Country: ${data.country_name}`;
        const flagImg = document.getElementById('flag');
        flagImg.src = `https://flagcdn.com/w320/${data.country_code.toLowerCase()}.png`;
        flagImg.hidden = false;

        document.getElementById('copy-btn').addEventListener('click', () => copyToClipboard(ip));
      } else {
        document.getElementById('ip').textContent = `IP: ${ip}`;
        document.getElementById('country').textContent = `Country: ${data.country_name}`;
        const flagImg = document.getElementById('flag');
        flagImg.src = `https://flagcdn.com/w320/${data.country_code.toLowerCase()}.png`;
        flagImg.hidden = false;

        document.getElementById('copy-btn').addEventListener('click', () => copyToClipboard(ip));
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    spinner.style.display = 'none';
  }
}

function handleCooldown() {
  const refreshButton = document.getElementById('refresh-btn');
  let countdown = 5;
  refreshButton.disabled = true;

  const interval = setInterval(() => {
    refreshButton.textContent = countdown--;
    if (countdown < 0) {
      clearInterval(interval);
      refreshButton.textContent = 'Refresh IP';
      refreshButton.disabled = false;
    }
  }, 1000);
}

document.getElementById('refresh-btn').addEventListener('click', () => {
  if (!refreshCooldown) {
    refreshCooldown = true;
    displayIPAndFlag(true);
    handleCooldown();
    setTimeout(() => { refreshCooldown = false; }, 5000);
  }
});

// Llamar a displayIPAndFlag al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  displayIPAndFlag();
});
