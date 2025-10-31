// Simple in-memory store for webhook events (production should use DB)
let webhookEvents: any[] = [];
const MAX_EVENTS = 1000;

export function addWebhookEvent(event: any) {
  webhookEvents.unshift(event);
  if (webhookEvents.length > MAX_EVENTS) {
    webhookEvents = webhookEvents.slice(0, MAX_EVENTS);
  }
}

export function getWebhookEvents() {
  return webhookEvents;
}

export function clearWebhookEvents() {
  webhookEvents = [];
}

// Extract conversations from webhook events
export function getConversations() {
  const convMap = new Map<string, any>();
  
  for (const evt of webhookEvents) {
    const entries = evt?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        const messages = value?.messages || [];
        const statuses = value?.statuses || [];
        
        // Process incoming messages
        for (const msg of messages) {
          const from = msg.from;
          if (!from) continue;
          
          if (!convMap.has(from)) {
            convMap.set(from, {
              id: from,
              phone: from,
              name: value?.contacts?.find((c: any) => c.wa_id === from)?.profile?.name || from,
              messages: [],
              lastMessageTime: 0,
              unread: 0
            });
          }
          
          const conv = convMap.get(from)!;
          conv.messages.push({
            id: msg.id,
            from: 'them',
            text: msg.text?.body || msg.caption || '(media)',
            timestamp: parseInt(msg.timestamp) * 1000,
            type: msg.type,
            mediaId: msg.image?.id || msg.document?.id || msg.video?.id || msg.audio?.id
          });
          conv.lastMessageTime = Math.max(conv.lastMessageTime, parseInt(msg.timestamp) * 1000);
          conv.unread++;
        }
        
        // Process status updates (sent messages)
        for (const status of statuses) {
          const recipient = status.recipient_id;
          if (!recipient) continue;
          
          if (!convMap.has(recipient)) {
            convMap.set(recipient, {
              id: recipient,
              phone: recipient,
              name: recipient,
              messages: [],
              lastMessageTime: 0,
              unread: 0
            });
          }
          
          const conv = convMap.get(recipient)!;
          const existing = conv.messages.find((m: any) => m.id === status.id);
          if (existing) {
            existing.status = status.status;
          } else {
            conv.messages.push({
              id: status.id,
              from: 'me',
              text: '(sent message)',
              timestamp: parseInt(status.timestamp) * 1000,
              status: status.status
            });
            conv.lastMessageTime = Math.max(conv.lastMessageTime, parseInt(status.timestamp) * 1000);
          }
        }
      }
    }
  }
  
  return Array.from(convMap.values())
    .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
}
