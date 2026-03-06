const { createClient } = require('@supabase/supabase-js');

const SECTIONS = [
  { id: 'morning', count: 4, prompt: '4 morning briefing cards for a creative director and app founder who is a mom. Mix: AI news, creative tools, Estral app updates, mom life tips.' },
  { id: 'news', count: 5, prompt: '5 top AI news stories from this week. Real headlines, what happened, why it matters.' },
  { id: 'mom', count: 4, prompt: '4 AI tips specifically for busy professional moms.' },
  { id: 'estral', count: 4, prompt: '4 app building ideas or milestones for building an AI news app called Xpand.' },
  { id: 'creative', count: 5, prompt: '5 AI workflow hacks for a creative director.' },
  { id: 'follows', count: 6, prompt: '6 Instagram accounts a creative AI-enthusiast mom should follow.' },
];

async function generateCardsForSection(sectionId, prompt, count) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const systemPrompt = `You respond only with a valid JSON array. No markdown, no code fences, no explanation.`;
  const userPrompt = `Generate exactly ${count} cards. ${prompt}

Return a JSON array with exactly ${count} objects. Each object has only these keys: "title", "body", "emoji", "tag".
Example: [{"title":"...","body":"...","emoji":"📌","tag":"Category"}]`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  return arr.slice(0, count).map((c) => ({
    title: c.title ?? '',
    body: c.body ?? '',
    emoji: c.emoji ?? '✨',
    tag: c.tag ?? '',
    section_id: sectionId,
    card_date: null, // set below
  }));
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, error: 'SUPABASE_URL or SUPABASE_SERVICE_KEY not set' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const cardDate = todayISO();

    const allCards = [];
    for (const { id, count, prompt } of SECTIONS) {
      const cards = await generateCardsForSection(id, prompt, count);
      cards.forEach((c) => { c.card_date = cardDate; });
      allCards.push(...cards);
    }

    const { error: deleteError } = await supabase
      .from('daily_cards')
      .delete()
      .eq('card_date', cardDate);

    if (deleteError) {
      return res.status(500).json({ success: false, error: `Supabase delete failed: ${deleteError.message}` });
    }

    if (allCards.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    const { error: insertError } = await supabase
      .from('daily_cards')
      .insert(allCards);

    if (insertError) {
      return res.status(500).json({ success: false, error: `Supabase insert failed: ${insertError.message}` });
    }

    return res.status(200).json({ success: true, count: allCards.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
