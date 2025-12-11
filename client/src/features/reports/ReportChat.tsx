import { useRef } from "react";
import { getRoleLabel } from "../../utils/roles";
import { Button, InputGroup, Form } from "react-bootstrap";
import "./ReportChat.css";

interface ReportChatProps {
  canSeeChat: boolean;
  messages: any[];
  messagesLoading: boolean;
  messagesError: string;
  currentUserId: string | number | null;
  display: any;
  messageText: string;
  setMessageText: (v: string) => void;
  messageLoading: boolean;
  messageError: string;
  onSend: () => void;
}

export default function ReportChat({
  canSeeChat,
  messages,
  messagesLoading,
  messagesError,
  currentUserId,
  display,
  messageText,
  setMessageText,
  messageLoading,
  messageError,
  onSend,
}: ReportChatProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  if (!canSeeChat) return null;

  return (
    <>
      <div
        style={{
          width: "100%",
          background: "#f8fafc",
          borderRadius: 8,
          padding: "1rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <h6 className="report-chat-header" style={{ fontWeight: 600 }}>
          {(() => {
            if (
              display?.user && 
              currentUserId === display.user.id &&
              display.user.role === "CITIZEN"
            ) {
              return "Chat with Participium Support";
            }
            return "Chat with citizen";
          })()}
        </h6>
        <div className="mt-4 mb-3">
            {messagesLoading ? (
            <div>Loading messages...</div>
            ) : messagesError ? (
            <div style={{ color: "red" }}>{messagesError}</div>
            ) : messages.length === 0 ? (
            <div style={{ color: "#888" }}>No messages yet.</div>
            ) : (
            <div
              ref={chatRef}
                className="report-chat-scroll"
                style={{
                maxHeight: 250,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                }}
            >
                {messages.map((msg, idx) => {
                const senderId = msg.senderId ?? msg.sender?.id;
                const isMe =
                    currentUserId != null &&
                    senderId != null &&
                    String(senderId) === String(currentUserId);
                  const roleKey = msg.senderRole ?? msg.sender?.role;
                  const roleLabel = roleKey ? getRoleLabel(roleKey) : undefined;
                return (
                  <div
                    key={msg.id || idx}
                    className={`chat-bubble ${isMe ? "me" : "other"}`}
                    style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                      borderRadius: 18,
                      marginBottom: 4,
                      padding: "10px 16px 6px 16px",
                      position: "relative",
                      marginLeft: isMe ? "auto" : 0,
                      marginRight: isMe ? 0 : "auto",
                      wordBreak: "break-word",
                    }}
                  >
                    <div className="sender-label">
                      {isMe
                        ? "Me:"
                        : roleLabel
                        ? roleLabel
                        : msg.sender?.firstName || msg.sender?.lastName
                        ? `${msg.sender?.firstName || ""} ${msg.sender?.lastName || ""}`.trim()
                        : roleKey || "Unknown role"}
                    </div>
                    <div style={{ fontSize: "1rem", marginBottom: 2 }}>
                        {msg.content}
                    </div>
                    <div
                        style={{
                        fontSize: "0.8rem",
                        color: "#666",
                        marginTop: 2,
                        textAlign: isMe ? "right" : "left",
                        }}
                    >
                        {!isMe && (
                          <span className="msg-meta name">
                            {msg.sender?.firstName || ""} {msg.sender?.lastName || ""}
                          </span>
                        )}
                        {msg.createdAt && (
                          <span className="msg-meta time" style={{ marginLeft: 8 }}>
                            {new Date(msg.createdAt).toLocaleString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                    </div>
                    </div>
                );
                })}
            </div>
            )}
        </div>
        <div className="report-chat-input" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <InputGroup style={{ flex: 1 }}>
              <Form.Control
                id="message-input"
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                disabled={messageLoading}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter" && !messageLoading && messageText.trim()) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                aria-label="Message text"
                style={{ borderRadius: 6 }}
              />
            </InputGroup>

            <Button
              variant="primary"
              disabled={!messageText.trim() || messageLoading}
              onClick={onSend}
              style={{ whiteSpace: "nowrap" }}
            >
              {messageLoading ? "Sending..." : "Send"}
            </Button>
          </div>

          {messageError && (
            <div className="report-chat-feedback allign" style={{ marginTop: 8 }}>
              <div style={{ color: "#e11d48" }}>{messageError}</div>
            </div>
          )}
      </div>
    </>
  );
}
