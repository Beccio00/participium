import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

const mockChat = {
  id: 1,
  participants: ["Technical Officer", "Citizen"],
  messages: [
    {
      sender: "Technical Officer",
      content: "We have taken charge of your report.",
      timestamp: "2025-11-25 10:30",
    },
    {
      sender: "Citizen",
      content: "Thank you for the update!",
      timestamp: "2025-11-25 11:00",
    },
    {
      sender: "Technical Officer",
      content: "We are working to resolve the issue.",
      timestamp: "2025-11-26 09:15",
    },
  ],
};

const ChatDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // In a real app, fetch chat by id
  const [messages, setMessages] = useState(mockChat.messages);
  const [input, setInput] = useState("");

  return (
    <Card style={{ maxWidth: 600, margin: "2rem auto" }}>
      <Card.Header as="h5">
        Conversation with{" "}
        {mockChat.participants
          .filter((p: string) => p !== "Citizen")
          .join(", ")}
        <Button
          variant="outline-primary"
          size="sm"
          style={{ float: "right" }}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Card.Header>
      <Card.Body style={{ background: "#f8f9fa" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: "1.2em" }}>
            <div
              style={{
                fontWeight: "bold",
                color: msg.sender === "Citizen" ? "var(--primary)" : "#482F1D",
              }}
            >
              {msg.sender}
            </div>
            <div>{msg.content}</div>
            <div style={{ fontSize: "0.8em", color: "#888" }}>
              {msg.timestamp}
            </div>
          </div>
        ))}
        <form
          style={{ marginTop: "2em", display: "flex", gap: "0.5em" }}
          onSubmit={(e) => {
            e.preventDefault();
            // In a real app, send message to backend
            const newMsg = {
              sender: "Citizen",
              content: input,
              timestamp: new Date().toLocaleString(),
            };
            setMessages([...messages, newMsg]);
            setInput("");
          }}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5em",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
            required
          />
          <Button type="submit" variant="primary">
            Send
          </Button>
        </form>
      </Card.Body>
    </Card>
  );
};

export default ChatDetail;
