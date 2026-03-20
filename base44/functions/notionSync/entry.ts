import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Notion integration — read/write pages and databases.
 * Actions:
 *   search          — search Notion workspace
 *   get_page        — get a page's content
 *   get_database    — get database items
 *   create_page     — create a page in a database
 *   append_blocks   — append content blocks to a page
 */

const NOTION_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function getHeaders() {
  const token = Deno.env.get("NOTION_API_KEY");
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

function blocksToMarkdown(blocks) {
  return blocks.map((block) => {
    const type = block.type;
    const data = block[type];
    if (!data) return "";

    const text = (data.rich_text || []).map((t) => t.plain_text).join("");

    switch (type) {
      case "paragraph": return text;
      case "heading_1": return `# ${text}`;
      case "heading_2": return `## ${text}`;
      case "heading_3": return `### ${text}`;
      case "bulleted_list_item": return `- ${text}`;
      case "numbered_list_item": return `1. ${text}`;
      case "to_do": return `- [${data.checked ? "x" : " "}] ${text}`;
      case "toggle": return `> ${text}`;
      case "code": return `\`\`\`${data.language || ""}\n${text}\n\`\`\``;
      case "quote": return `> ${text}`;
      case "divider": return "---";
      case "callout": return `> 💡 ${text}`;
      default: return text;
    }
  }).filter(Boolean).join("\n\n");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = Deno.env.get("NOTION_API_KEY");
    if (!token) {
      return Response.json({ error: "NOTION_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { action = "search" } = body;
    const headers = getHeaders();

    if (action === "search") {
      const { query, filter_type } = body;
      const payload = {};
      if (query) payload.query = query;
      if (filter_type) payload.filter = { value: filter_type, property: "object" };
      payload.page_size = body.page_size || 20;

      const resp = await fetch(`${NOTION_BASE}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `Notion search error: ${resp.status}`, details: err }, { status: resp.status });
      }

      const result = await resp.json();
      const items = (result.results || []).map((item) => ({
        id: item.id,
        type: item.object,
        title: item.properties?.title?.title?.[0]?.plain_text
          || item.properties?.Name?.title?.[0]?.plain_text
          || (item.object === "page" ? "Untitled" : "Database"),
        url: item.url,
        last_edited: item.last_edited_time,
      }));

      return Response.json({ success: true, results: items, count: items.length });
    }

    if (action === "get_page") {
      const { page_id } = body;
      if (!page_id) {
        return Response.json({ error: "page_id is required" }, { status: 400 });
      }

      // Fetch page metadata + blocks in parallel
      const [pageResp, blocksResp] = await Promise.all([
        fetch(`${NOTION_BASE}/pages/${page_id}`, { headers }),
        fetch(`${NOTION_BASE}/blocks/${page_id}/children?page_size=100`, { headers }),
      ]);

      if (!pageResp.ok) {
        const err = await pageResp.text();
        return Response.json({ error: `Page fetch error: ${pageResp.status}`, details: err }, { status: pageResp.status });
      }

      const page = await pageResp.json();
      const blocks = blocksResp.ok ? await blocksResp.json() : { results: [] };

      const title = Object.values(page.properties || {})
        .find((p) => p.type === "title")
        ?.title?.[0]?.plain_text || "Untitled";

      const markdown = blocksToMarkdown(blocks.results || []);

      return Response.json({
        success: true,
        page: {
          id: page.id,
          title,
          url: page.url,
          last_edited: page.last_edited_time,
          markdown,
          properties: page.properties,
        },
      });
    }

    if (action === "get_database") {
      const { database_id, filter, sorts, page_size } = body;
      if (!database_id) {
        return Response.json({ error: "database_id is required" }, { status: 400 });
      }

      const payload = { page_size: page_size || 50 };
      if (filter) payload.filter = filter;
      if (sorts) payload.sorts = sorts;

      const resp = await fetch(`${NOTION_BASE}/databases/${database_id}/query`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `DB query error: ${resp.status}`, details: err }, { status: resp.status });
      }

      const result = await resp.json();
      const rows = (result.results || []).map((row) => {
        const props = {};
        for (const [key, val] of Object.entries(row.properties || {})) {
          if (val.type === "title") props[key] = val.title?.[0]?.plain_text || "";
          else if (val.type === "rich_text") props[key] = val.rich_text?.[0]?.plain_text || "";
          else if (val.type === "number") props[key] = val.number;
          else if (val.type === "select") props[key] = val.select?.name || "";
          else if (val.type === "multi_select") props[key] = (val.multi_select || []).map((s) => s.name);
          else if (val.type === "date") props[key] = val.date?.start || "";
          else if (val.type === "checkbox") props[key] = val.checkbox;
          else if (val.type === "url") props[key] = val.url || "";
          else if (val.type === "email") props[key] = val.email || "";
          else props[key] = `[${val.type}]`;
        }
        return { id: row.id, url: row.url, ...props };
      });

      return Response.json({ success: true, rows, count: rows.length, has_more: result.has_more });
    }

    if (action === "create_page") {
      const { database_id, properties, content } = body;
      if (!database_id || !properties) {
        return Response.json({ error: "database_id and properties are required" }, { status: 400 });
      }

      const payload = {
        parent: { database_id },
        properties,
      };

      if (content) {
        payload.children = content.split("\n").filter(Boolean).map((line) => ({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: line } }],
          },
        }));
      }

      const resp = await fetch(`${NOTION_BASE}/pages`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `Create page error: ${resp.status}`, details: err }, { status: resp.status });
      }

      const result = await resp.json();
      return Response.json({ success: true, page_id: result.id, url: result.url });
    }

    if (action === "append_blocks") {
      const { page_id, content } = body;
      if (!page_id || !content) {
        return Response.json({ error: "page_id and content are required" }, { status: 400 });
      }

      const children = content.split("\n").filter(Boolean).map((line) => ({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: line } }],
        },
      }));

      const resp = await fetch(`${NOTION_BASE}/blocks/${page_id}/children`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ children }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        return Response.json({ error: `Append error: ${resp.status}`, details: err }, { status: resp.status });
      }

      const result = await resp.json();
      return Response.json({ success: true, blocks_added: (result.results || []).length });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("notionSync error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});