import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatWithClimate } from '../services/gemini';

function ClimateChat({ locationName, riskData, climateData }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: `Hi! I'm your local climate advisor for **${locationName}**. I've analyzed your historical weather patterns and current risk scores. How can I help you prepare?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "What should I include in my emergency kit?",
    "How can I prepare my home for extreme heat?",
    "Are there specific flood mitigation steps I can take?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithClimate(
        locationName, 
        riskData, 
        climateData.summary, 
        text, 
        messages.slice(1) // exclude the first greeting from history format since system prompt handles it
      );
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="climate-chat-section mt-8">
      <h3 className="section-title">Ask the Climate Advisor</h3>
      
      <div className="chat-card card">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.role}`}>
              {msg.role === 'model' && <div className="avatar-dot">AI</div>}
              <div className="message-bubble">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="message-wrapper model">
              <div className="avatar-dot">AI</div>
              <div className="message-bubble typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-suggestions">
          {suggestions.map((sug, i) => (
            <button key={i} className="suggestion-chip" onClick={() => handleSend(sug)}>
              {sug}
            </button>
          ))}
        </div>

        <div className="chat-input-area">
          <input 
            type="text" 
            placeholder="Ask about climate risks, preparations..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend(input)}
            disabled={loading}
          />
          <button onClick={() => handleSend(input)} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClimateChat;
