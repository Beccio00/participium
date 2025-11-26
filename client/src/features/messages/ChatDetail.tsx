import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { getReportMessages, sendReportMessage } from "../../api/messagesApi";
import { getReports } from "../../api/api";

const ChatDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = Number(id);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [rawMsgs, reports] = await Promise.all([
          getReportMessages(reportId),
          getReports(),
        ]);
        // Patch: Map backend format to frontend expected format
        const msgs = Array.isArray(rawMsgs)
          ? rawMsgs.map((m: any) => ({
              sender: m.sender || m.senderId || "System",
              content: m.content,
              timestamp:
                m.timestamp || m.createdAt || new Date().toLocaleString(),
            }))
          : [];
        setMessages(msgs);
        const rep = reports.find((r: any) => r.id === reportId);
        setReport(rep);
      } catch (err: any) {
        // Patch: Handle non-JSON errors (e.g. HTML response)
        if (err instanceof SyntaxError) {
          setError("Server error: invalid response format");
        } else {
          setError(err.message || "Failed to load chat");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reportId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newMsg = await sendReportMessage(reportId, input);
      // Fallback per campi mancanti
      setMessages([
        ...messages,
        {
          sender: newMsg.sender || "You",
          content: newMsg.content || input,
          timestamp: newMsg.timestamp || new Date().toLocaleString(),
        },
      ]);
      setInput("");
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    }
  };

  return (
    <Card style={{ maxWidth: 600, margin: "2rem auto" }}>
      <Card.Header as="h5">
        {report ? (
          <>
            Report: <span style={{ fontWeight: 600 }}>{report.title}</span>
            <Button
              variant="outline-primary"
              size="sm"
              style={{ float: "right" }}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </>
        ) : (
          "Loading..."
        )}
      </Card.Header>
      <Card.Body style={{ background: "#f8f9fa" }}>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: "var(--danger)" }}>{error}</div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              if (!msg || typeof msg !== "object") return null;
              const sender = msg.sender ?? "System";
              const content = msg.content ?? "";
              const timestamp = msg.timestamp ?? "";
              // Non mostrare i messaggi di tipo System che iniziano con 'Report submitted:'
              if (
                sender === "System" &&
                typeof content === "string" &&
                content.trim().toLowerCase().startsWith("report submitted:")
              ) {
                return null;
              }
              const isAssignmentMsg =
                typeof content === "string" &&
                content.toLowerCase().includes("technical officer assigned");
              return (
                <div
                  key={idx}
                  style={{
                    marginBottom: "1.2em",
                    background: isAssignmentMsg ? "#e9ecef" : undefined,
                    borderRadius: isAssignmentMsg ? "8px" : undefined,
                    padding: isAssignmentMsg ? "0.75em" : undefined,
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color:
                        sender === "Citizen" ? "var(--primary)" : "#482F1D",
                    }}
                  >
                    {sender}
                  </div>
                  <div>{content}</div>
                  <div style={{ fontSize: "0.8em", color: "#888" }}>
                    {timestamp}
                  </div>
                </div>
              );
            })}
            <form
              style={{ marginTop: "2em", display: "flex", gap: "0.5em" }}
              onSubmit={handleSend}
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
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ChatDetail;
