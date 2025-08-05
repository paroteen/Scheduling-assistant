// src/Chatbot.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function Chatbot({ employees, rules, scheduleEvents }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! How can I help you with the schedule today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null); // Ref for the textarea

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { from: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const generateScheduleSummary = (events) => {
        if (!events || events.length === 0) return "No schedule events are available for this week.";
        const dailySchedules = {};
        events.forEach(event => {
            const { resourceId, title, start, end } = event;
            if (!resourceId || !title || !start || !end) return;
            const startDate = new Date(start);
            const endDate = new Date(end);
            const dayKey = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
            if (!dailySchedules[dayKey]) dailySchedules[dayKey] = {};
            if (!dailySchedules[dayKey][resourceId]) dailySchedules[dayKey][resourceId] = [];
            const startTimeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
            const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
            dailySchedules[dayKey][resourceId].push({ start: startDate, text: `${startTimeStr}-${endTimeStr} ${title}` });
        });
        let summaryText = "Key Schedule Information:\n";
        for (const day in dailySchedules) {
            summaryText += `\n--- ${day} ---\n`;
            for (const employee in dailySchedules[day]) {
                const sortedEvents = dailySchedules[day][employee]
                    .sort((a, b) => a.start - b.start)
                    .map(e => e.text)
                    .join(', ');
                summaryText += `${employee}: ${sortedEvents}\n`;
            }
        }
        return summaryText;
    };

    const scheduleSummary = generateScheduleSummary(scheduleEvents);

    const prompt = `
      You are a helpful scheduling assistant. Your role is to answer questions based ONLY on the data provided below. Do not make up information. Be concise and clear.

      Here is the current application state:
      1. Employees Data: ${JSON.stringify(employees, null, 2)}
      2. Scheduling Rules: ${JSON.stringify(rules, null, 2)}
      3. Schedule Summary for the week:
      ${scheduleSummary}
      ---
      Based on all of the data above, please answer the following user question:
      User Question: "${input}"
    `;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        if (!response.ok) throw new Error('API request failed');
        const result = await response.json();
        const botResponse = result.response || 'Sorry, I had trouble understanding that.';
        setMessages(prev => [...prev, { from: 'bot', text: botResponse }]);
    } catch (error) {
      console.error("Error calling chat API:", error);
      setMessages(prev => [...prev, { from: 'bot', text: "Sorry, I'm having trouble connecting to my brain right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <h4 className="chatbot-title">AI Chat Support</h4>
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.from}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div className="message bot">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbot-input-area">
        <textarea
          ref={textareaRef}
          rows="1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
              // Send on Enter, but allow Shift+Enter for new lines
              if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
              }
          }}
          placeholder="Ask about the schedule..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>Send</button>
      </div>
    </div>
  );
}
