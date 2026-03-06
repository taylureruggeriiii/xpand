const { createClient } = require('@supabase/supabase-js');

const SECTIONS = [
  { id: 'morning', count: 10, prompt: 'Generate exactly 10 morning briefing cards for a creative director, app founder and mom. Cover: the most important AI news today, creative industry breakthroughs, productivity hacks, and mindset shifts. Make each card feel like insider knowledge she can\'t get anywhere else.' },
  { id: 'news', count: 10, prompt: 'Generate exactly 10 of the most groundbreaking AI news stories right now. Only the biggest launches, funding rounds, model releases, and industry shifts that are changing everything. Be specific with company names, numbers, and why it matters.' },
  { id: 'mom', count: 10, prompt: 'Generate exactly 10 of the best AI + motherhood hacks that actually work. Cover: AI tools that save time for busy moms, tech that helps with kids, workflow hacks for working moms, tools for meal planning, scheduling, and sanity. Be specific and practical.' },
  { id: 'estral', count: 10, prompt: 'Generate exactly 10 insights for building a successful AI news app called Xpand. Cover: product features to build, growth strategies, monetization ideas, technical improvements, and competitor analysis. Be bold and specific.' },
  { id: 'creative', count: 10, prompt: 'Generate exactly 10 groundbreaking AI workflow hacks for creative directors. Cover: the best AI tools for design, video, social, branding, and content. Include specific prompts, tools, and time-saving techniques that top creatives are using.' },
  { id: 'follows', count: 10, prompt: 'Generate exactly 10 must-follow accounts for a creative director and AI-enthusiast mom. Cover: AI researchers, creative directors, mom entrepreneurs, tech founders, and culture makers who are changing the game. Include why each one is unmissable.' },
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
