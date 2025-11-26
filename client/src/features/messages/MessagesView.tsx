import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { getReports } from "../../api/api";

type Conversation = {
  id: number;
  title: string;
  lastMessage: string;
  lastSender: string;
  lastTimestamp: string;
};

const MessagesView: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchConversations() {
      try {
        const reports = await getReports();
        // Simulate conversations: each report is a conversation, lastMessage is not available so use description
        const convs = reports.map((r) => ({
          id: r.id,
          title: r.title,
          lastMessage: r.description,
          lastSender: "Technical Officer", // Placeholder, replace with real sender if available
          lastTimestamp: r.createdAt || "",
        }));
        setConversations(convs);
      } catch (err: any) {
        setError(err.message || "Failed to load conversations");
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  return (
    <Card style={{ maxWidth: 600, margin: "2rem auto" }}>
      <Card.Header as="h5">Conversations</Card.Header>
      <ListGroup variant="flush">
        {loading ? (
          <ListGroup.Item>Loading...</ListGroup.Item>
        ) : error ? (
          <ListGroup.Item>{error}</ListGroup.Item>
        ) : conversations.length === 0 ? (
          <ListGroup.Item>No conversations available.</ListGroup.Item>
        ) : (
          conversations.map((conv) => (
            <ListGroup.Item
              key={conv.id}
              action
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/messages/${conv.id}`)}
            >
              <strong>{conv.title}</strong>
              <div style={{ fontSize: "0.95em", color: "#555" }}>
                {conv.lastMessage}
              </div>
              <div style={{ fontSize: "0.8em", color: "#888" }}>
                {conv.lastSender} &middot; {conv.lastTimestamp}
              </div>
            </ListGroup.Item>
          ))
        )}
      </ListGroup>
    </Card>
  );
};

export default MessagesView;
