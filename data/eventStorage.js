const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DATA_FILE_PATH = path.join(__dirname, 'events.json');
console.log('Attempting to write/read events.json at:', DATA_FILE_PATH);

async function readEvents() {
    try {
        const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
        if (data.trim() === '') {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('events.json not found. Creating a new one.');
        } else if (error instanceof SyntaxError) {
            console.warn('Error parsing events.json. File might be corrupted. Starting with empty data.');
        } else {
            console.error('Error reading events.json:', error);
        }
        return [];
    }
}

async function writeEvents(events) {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(events, null, 2), 'utf8');
}

async function saveNewEvents(newScrapedEvents) {
    const eventsToSave = newScrapedEvents.map(event => ({
        id: crypto.randomUUID(),
        ...event
    }));

    await writeEvents(eventsToSave);
    console.log(`Successfully saved ${eventsToSave.length} events to events.json, overwriting previous data.`);

    return eventsToSave;
}

module.exports = {
    readEvents,
    writeEvents,
    saveNewEvents,
};
