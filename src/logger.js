const fs = require('fs');
const path = require('path');
const { JSCoverage } = require('puppeteer');


function logError(error, scraperName) {
  const logsDir = path.join(__dirname, '../logs'); 
  const logFile = path.join(logsDir, 'error-log.json'); 

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }


  const errorLog = {
    timestamp: new Date().toISOString(),
    scraper: scraperName,
    message: error.message,
    stack: error.stack,
  };

  try {
    let logs = [];
    if (fs.existsSync(logFile)) {
      const existingLogs = fs.readFileSync(logFile, 'utf8');
      logs = JSON.parse(existingLogs); 
    }
    logs.push(errorLog); 
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2)); 
    console.log('Error logged successfully.');
  } catch (fileError) {
    console.error('Failed to log error:', fileError.message);
  }
}

module.exports = logError;
