"use strict";
const { query } = require("../db");

async function getOrCreateConversation({ channel, customerId, customerName }) {
  // Try to find an existing non-escalated conversation from the last 24h
  const { rows: existing } = await query(
    `SELECT * FROM conversations
     WHERE channel = $1 AND customer_id = $2 AND escalated = false
       AND updated_at > NOW() - INTERVAL '24 hours'
     ORDER BY updated_at DESC LIMIT 1`,
    [channel, customerId]
  );
  if (existing.length > 0) return existing[0];

  // Create new
  const { rows } = await query(
    `INSERT INTO conversations (channel, customer_id, customer_name)
     VALUES ($1, $2, $3) RETURNING *`,
    [channel, customerId, customerName || null]
  );
  return rows[0];
}

async function addMessage({ conversationId, role, content }) {
  const { rows } = await query(
    `INSERT INTO chat_messages (conversation_id, role, content)
     VALUES ($1, $2, $3) RETURNING *`,
    [conversationId, role, content]
  );
  // Touch conversation updated_at
  await query("UPDATE conversations SET updated_at = NOW() WHERE id = $1", [conversationId]);
  return rows[0];
}

async function getHistory(conversationId, limit = 20) {
  const { rows } = await query(
    `SELECT role, content, created_at FROM chat_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [conversationId, limit]
  );
  return rows;
}

async function markEscalated(conversationId) {
  await query("UPDATE conversations SET escalated = true, updated_at = NOW() WHERE id = $1", [conversationId]);
}

async function listConversations({ limit = 50, offset = 0 } = {}) {
  const { rows } = await query(
    `SELECT c.*,
       (SELECT COUNT(*)::int FROM chat_messages WHERE conversation_id = c.id) AS message_count,
       (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
     FROM conversations c
     ORDER BY c.updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

async function getConversation(id) {
  const { rows } = await query("SELECT * FROM conversations WHERE id = $1", [id]);
  return rows[0] ?? null;
}

module.exports = {
  getOrCreateConversation, addMessage, getHistory,
  markEscalated, listConversations, getConversation,
};
