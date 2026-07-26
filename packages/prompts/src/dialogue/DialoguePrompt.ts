export interface DialoguePromptInput {
  project: {
    topic: string;
    language: string;
    platform: string;
    style: string;
  };
  directorPlan: {
    genre: string;
    tone: string;
    pacing: string;
  };
  story: {
    title: string;
    hook: string;
    premise: string;
    summary: string;
    acts: Array<{ name: string; description: string }>;
    characters: Array<{ name: string; role: string; personality: string }>;
    comedyBeat: string;
    ending: string;
  };
  scenes: Array<{
    id: number;
    title: string;
    act: string;
    duration: number;
    description: string;
    dialogue: string;
    visualPrompt: string;
    comedyElement: string;
  }>;
}

export class DialoguePrompt {
  readonly systemPrompt = `You are India's best comedy dialogue writer for SHORT-FORM VERTICAL VIDEO.

You write dialogue that SOUNDS like real Indian people talking, not scripted lines.
Your dialogue has these qualities:
- HINGLISH naturally mixed (Hindi + English as Indians actually speak)
- PUNCHY — max 6-10 words per line for short-form pacing
- CHARACTER-SPECIFIC — each character has a distinct way of speaking
- REACTION HEAVY — short exclamations, double-takes, exaggerated responses
- CULTURALLY GROUNDED — references to Indian daily life, brands, habits
- MEMORABLE PHRASES — lines people will quote and share

COMEDY DIALOGUE TECHNIQUES:
- Misunderstanding comedy: character takes something literally
- Deadpan delivery: serious tone for absurd situations
- Overreaction: disproportionate response to small things
- Callback: reference something from earlier in a new context
- Wordplay: Hindi/English puns, double meanings
- The "Arey!" moment: sudden realization or shock

VOICE DIRECTION:
- Protagonist: speaks fastest, most energetic
- Antagonist/straight man: slower, more deliberate, often confused
- Supporting: adds chaos, interrupts, reacts
- Each character's dialogue must be distinguishable by VOICE ALONE

CRITICAL RULES:
- Respond with ONLY valid JSON. No markdown, no prose, no code blocks.
- All dialogue in ${'{LANGUAGE}'} (Hinglish encouraged).
- Each character must speak in a DISTINCT voice pattern.
- Dialogue must fit the scene duration — don't write more words than can be spoken.
- Emotions must be SPECIFIC (not just "happy" — use "excited", "smug", "panicked", "deadpan").
- Timing must indicate WHERE in the scene the line lands (opening, reaction, punchline, exit).`;

  build(input: DialoguePromptInput): string {
    const { project, directorPlan, story, scenes } = input;

    const charactersText = story.characters
      .map(
        (c) =>
          `- ${c.name} (${c.role}): ${c.personality} — SPEAKING STYLE: describe how this character talks`,
      )
      .join('\n');

    const scenesText = scenes
      .map(
        (s) =>
          `Scene #${s.id} "${s.title}" (${s.duration}s, ${s.act}):
  Visual: ${s.description}
  Comedy: ${s.comedyElement}`,
      )
      .join('\n\n');

    return `Write dialogue for this comedy video:

PROJECT: ${project.topic} | ${project.language} | ${project.style}
TONE: ${directorPlan.tone} | PACING: ${directorPlan.pacing}
COMEDY BEAT: ${story.comedyBeat}

CHARACTERS:
${charactersText}

SCENES:
${scenesText}

DIALOGUE RULES:
1. Each scene must have 1-4 dialogue lines MAX (short-form pacing)
2. First line of each scene must be the HOOK or SETUP line
3. Last line must be the PUNCHLINE or REACTION
4. Characters should INTERRUPT each other for comedy
5. Use EXCLAMATIONS: "Arey!", "Arre bhai!", "Yaar!", "Achha?!", "Nahi nahi!"
6. Add STAGE DIRECTIONS in parentheses if needed: "(whispers)", "(shouting)", "(deadpan)"
7. Emotions must be vivid: "panicked", "smugly", "confused", "overjoyed", "terrified"

Return ONLY this JSON (no markdown, no code blocks):
{
  "scenes": [
    {
      "id": 1,
      "dialogue": [
        {
          "character": "character name",
          "text": "dialogue line in ${project.language} (keep under 10 words for pacing)",
          "emotion": "specific emotion (e.g. panicky, smug, confused, deadpan, overjoyed)",
          "timing": "where in scene: opening / reaction / buildup / punchline / exit"
        }
      ]
    }
  ]
}`;
  }
}
