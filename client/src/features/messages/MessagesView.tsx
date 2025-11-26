import React, { useState } from "react";
import { useNavigate } from "react-router";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

type Message = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
};

const mockMessages: Message[] = [
  {
    id: 1,
    sender: "Technical Officer",
    content: "We have taken charge of your report.",
    timestamp: "2025-11-25 10:30",
  },
  {
    id: 2,
    sender: "Technical Officer",
    content: "We are working to resolve the issue.",
    timestamp: "2025-11-26 09:15",
  },
];

const MessagesView: React.FC = () => {
  const [messages] = useState<Message[]>(mockMessages);
  const navigate = useNavigate();

  return (
    <Card style={{ maxWidth: 600, margin: "2rem auto" }}>
      <Card.Header as="h5">Conversations</Card.Header>
      <ListGroup variant="flush">
        {messages.length === 0 ? (
          <ListGroup.Item>No messages available.</ListGroup.Item>
        ) : (
          messages.map((msg) => (
            <ListGroup.Item
              key={msg.id}
              action
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/messages/${msg.id}`)}
            >
              <strong>{msg.sender}:</strong> {msg.content}
              <div style={{ fontSize: "0.8em", color: "#888" }}>
                {msg.timestamp}
              </div>
            </ListGroup.Item>
          ))
        )}
      </ListGroup>
    </Card>
  );
};

export default MessagesView;
