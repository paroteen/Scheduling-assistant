// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import OpenAI from 'openai'; // <-- Import OpenAI library

import { INITIAL_EMPLOYEES } from './src/data/initialEmployees.js';
import { SCHEDULING_RULES } from './src/data/schedulingRules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Environment and Credential Checks ---
const LOCAL_TESTING = process.env.LOCAL_TESTING === 'true';

if (!process.env.OPENAI_API_KEY && !LOCAL_TESTING) {
  console.error('\nFATAL ERROR: The OPENAI_API_KEY environment variable is not set in your .env file.');
  process.exit(1);
}

let serviceAccountPath;
if (!LOCAL_TESTING) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('\nFATAL ERROR: The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
    process.exit(1);
  }
  serviceAccountPath = path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`\nFATAL ERROR: Service account file not found at: ${serviceAccountPath}`);
    process.exit(1);
  }
}

// --- App Setup ---
const app = express();
const { PORT = 5001, GOOGLE_PTO_CALENDAR_ID, GOOGLE_MEETINGS_CALENDAR_ID } = process.env;

// --- Data Storage ---
const DATA_DIR = path.join(__dirname, 'data');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const RULES_FILE = path.join(DATA_DIR, 'rules.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize data
let currentEmployees = {};
let currentRules = {};

// Load data from files if they exist, otherwise use defaults
try {
  if (fs.existsSync(EMPLOYEES_FILE)) {
    currentEmployees = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf8'));
  } else {
    currentEmployees = { ...INITIAL_EMPLOYEES };
    // Save initial employees to file
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(currentEmployees, null, 2));
  }
} catch (error) {
  console.error('Error loading employees:', error);
  currentEmployees = { ...INITIAL_EMPLOYEES };
}

try {
  if (fs.existsSync(RULES_FILE)) {
    currentRules = JSON.parse(fs.readFileSync(RULES_FILE, 'utf8'));
  } else {
    currentRules = { ...SCHEDULING_RULES };
    // Save initial rules to file
    fs.writeFileSync(RULES_FILE, JSON.stringify(currentRules, null, 2));
  }
} catch (error) {
  console.error('Error loading rules:', error);
  currentRules = { ...SCHEDULING_RULES };
}

// --- API Clients ---
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

let calendar = null;
if (!LOCAL_TESTING) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    calendar = google.calendar({ version: 'v3', auth });
  } catch (error) {
    console.error('\nFATAL ERROR: Could not authenticate with Google Calendar API.', error);
    process.exit(1);
  }
} else {
  console.log('\nRunning in LOCAL TESTING mode - Google Calendar integration disabled');
}

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Endpoints ---

// --- NEW: Chat Endpoint ---
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'A prompt is required.' });
    }
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Or "gpt-4" if you have access
            messages: [{ role: 'user', content: prompt }],
        });

        const responseText = completion.choices[0].message.content;
        res.json({ response: responseText });

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ error: 'Failed to get response from AI.' });
    }
});


app.get('/api/events', async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'Start and end query parameters are required.' });
  try {
    const [ptoEvents, meetingEvents] = await Promise.all([
      fetchCalendarEvents(GOOGLE_PTO_CALENDAR_ID, start, end),
      fetchCalendarEvents(GOOGLE_MEETINGS_CALENDAR_ID, start, end),
    ]);
    res.json([...ptoEvents.map(e => ({ ...e, type: 'PTO' })), ...meetingEvents.map(e => ({ ...e, type: 'Meeting' }))]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

app.get('/api/employees', (req, res) => res.status(200).json(currentEmployees));

app.post('/api/employees', (req, res) => {
  currentEmployees = req.body;
  
  // Save employees to file
  if (!saveDataToFile(EMPLOYEES_FILE, currentEmployees)) {
    return res.status(500).json({ error: 'Failed to save employees' });
  }
  
  res.status(200).json({ success: true, employees: currentEmployees });
});

app.get('/api/rules', (req, res) => res.status(200).json(currentRules));

app.post('/api/rules', (req, res) => {
  currentRules = { ...currentRules, ...req.body };
  
  // Save rules to file
  if (!saveDataToFile(RULES_FILE, currentRules)) {
    return res.status(500).json({ error: 'Failed to save rules' });
  }
  
  res.status(200).json({ success: true, rules: currentRules });
});

async function fetchCalendarEvents(calendarId, timeMin, timeMax) {
  if (!calendarId) return [];
  try {
    const { data } = await calendar.events.list({
      calendarId, timeMin, timeMax, singleEvents: true, orderBy: 'startTime',
      fields: 'items(id,summary,start,end,attendees)',
    });
    return data.items ? data.items.map(event => ({
      id: event.id, title: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      allDay: !!event.start?.date && !event.start?.dateTime,
      attendees: event.attendees ? event.attendees.map(a => a.email) : [],
    })) : [];
  } catch (error) {
    console.error(`Error fetching from calendar ${calendarId}:`, error.message);
    return [];
  }
}

// --- Serve Static React App ---
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));

app.listen(PORT, () => {
  console.log(`\nServer is running and listening on http://localhost:${PORT}`);
});
