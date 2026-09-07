const { GoogleGenerativeAI } = require('@google/generative-ai');
const ApiError = require('../utils/apiError');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.5-flash'; // fallback: gemini-3.5-flash-lite

const sessionPlanSystem = `You are an expert one-to-one tutoring session planner.
Create a personalized lesson plan using only the supplied student profile and session history.
Analyze the student's academic level, subject, learning goals, weak areas, current topic, previous sessions, and previous learning progress.
The plan must be realistic for one tutoring session. Do not invent information.
Use recurring weak areas and prior outcomes to adapt the lesson; do not repeat mastered concepts unless reinforcement is appropriate.
Return ONLY valid JSON, with no markdown or explanation outside the JSON.
Use exactly 3 learning objectives, 4 lesson outline points, and 3 progressively challenging practice questions.

CRITICAL PRACTICE QUESTION RULES:
- Each \"question\" field must be an ACTUAL, CONCRETE problem the student can solve during the session — not a vague instruction.
- For Mathematics: write real equations or word problems (e.g. "Factorise: x² + 5x + 6").
- For Physics/Chemistry/Science: write real calculation or experimental questions.
- For Programming/Computing: write real coding tasks or debugging exercises.
- For Literature/English: write real analysis prompts or writing exercises with specific word counts.
- For History/Social Studies: write specific comparison or cause/effect questions.
- For any other subject: write specific, answerable problems — never "practice X" or "try Y".
- Difficulty must be easy → medium → hard, calibrated to the student's current level.
Do not fabricate grades, scores, attendance, achievements, or performance metrics.`;

const sessionReviewSystem = `You are an expert educational session reviewer.
Analyze the completed tutoring session using the student's profile, session plan, and tutor notes.
Summarize what was covered, identify progress only where supported by the notes, generate subject-specific homework problems based on the session content, and suggest what to cover next.

CRITICAL HOMEWORK RULES:
- The "task" field must be an ACTUAL PROBLEM the student must solve — not a generic instruction.
- For Mathematics: write a real equation or word problem (e.g. "Solve: 3x² - 7x + 2 = 0 using the quadratic formula").
- For Physics/Chemistry/Science: write a real calculation or experiment question (e.g. "A 5 kg block slides down a 30° frictionless incline. Find the acceleration.").
- For Programming/Computing: write a real coding task (e.g. "Write a Python function that takes a list of integers and returns the two largest values without using sort().").
- For Literature/English: write a real prompt (e.g. "In 150 words, analyse how Orwell uses the character of Boxer to criticise the working class in 'Animal Farm'.").
- For History/Social Studies: write a real response question (e.g. "Compare and contrast the causes of World War I and World War II in five key points.").
- For any other subject: write a specific, concrete problem or task — never a vague description like 'practice X' or 'review Y'.
- The "description" field should contain a helpful hint, scaffolding tip, or approach guide to solving the task — not a repeat of the task.
- Homework difficulty must match the student's current level and address their weak areas where supported by the notes.
- Do NOT invent achievements or facts. Do NOT fabricate grades, scores, or metrics.
Return ONLY valid JSON, with no markdown or explanation outside the JSON.
The homework array must contain 2 or 3 tasks.`;

const progressSystem = `You are an educational progress analyst.
Analyze the student's historical tutoring sessions and AI-generated session reviews.
Identify supported trends in areas of improvement, recurring difficulties, unresolved weak areas, topics needing reinforcement, and recommended future priorities.
Do not invent performance data or overstate progress. If evidence is missing, say so briefly.
Return ONLY valid JSON in exactly this form: {"summary":"..."}.`;

const asText = (value) => (value === undefined || value === null ? 'Not provided' : String(value));
const formatSessions = (sessions = []) => sessions.map((session) => JSON.stringify({
  topic: session.topic,
  scheduledAt: session.scheduledAt,
  status: session.status,
  notes: session.notes || '',
  aiPlan: session.aiPlan || null,
  aiReview: session.aiReview || null,
})).join('\n');

const buildPlanPrompt = (data) => `${sessionPlanSystem}

STUDENT PROFILE
Name: ${asText(data.profile.name)}
Subject: ${asText(data.profile.subject)}
Current Level: ${asText(data.profile.currentLevel)}
Learning Goals: ${asText(data.profile.learningGoals)}
Weak Areas: ${asText(data.profile.weakAreas)}

CURRENT SESSION
Topic: ${asText(data.session.topic)}
Scheduled Date: ${asText(data.session.scheduledAt)}

PAST SESSIONS
${formatSessions(data.pastSessions)}

PREVIOUS AI REVIEWS
${formatSessions(data.pastSessions.filter((session) => session.aiReview))}

Return exactly:
{"learningObjectives":["string","string","string"],"lessonOutline":[{"step":1,"title":"string","description":"string"},{"step":2,"title":"string","description":"string"},{"step":3,"title":"string","description":"string"},{"step":4,"title":"string","description":"string"}],"practiceQuestions":[{"question":"string","difficulty":"easy"},{"question":"string","difficulty":"medium"},{"question":"string","difficulty":"hard"}]}`;

const buildReviewPrompt = (data, homeworkCount = 3) => {
  const count = Math.max(1, Math.min(10, parseInt(homeworkCount, 10) || 3));
  const diffCycle = ['easy', 'medium', 'hard'];
  const sampleHomework = Array.from({ length: count }, (_, i) => 
    `{"task":"concrete question ${i + 1}","description":"guidance or step hint","difficulty":"${diffCycle[i % diffCycle.length]}"}`
  ).join(',');

  return `${sessionReviewSystem}

STUDENT PROFILE
Name: ${asText(data.profile.name)}
Subject: ${asText(data.profile.subject)}
Current Level: ${asText(data.profile.currentLevel)}
Learning Goals: ${asText(data.profile.learningGoals)}
Weak Areas: ${asText(data.profile.weakAreas)}

CURRENT SESSION
Topic: ${asText(data.session.topic)}

SESSION PLAN
${JSON.stringify(data.session.aiPlan || null)}

TUTOR NOTES
${asText(data.session.notes)}

PREVIOUS SESSION CONTEXT
${formatSessions(data.previousSessions)}

IMPORTANT: The subject is "${asText(data.profile.subject)}". You MUST generate exactly ${count} homework problem${count > 1 ? 's' : ''}.
Every homework task MUST be a real, concrete, solvable problem for this specific subject and topic — NOT a vague instruction like "practice X" or "review Y". Write actual problems the student must answer.

Return exactly valid JSON in this schema:
{"summary":"string","homework":[${sampleHomework}],"nextSessionSuggestion":"string"}`;
};

const buildProgressPrompt = (data) => `${progressSystem}

STUDENT PROFILE
Name: ${asText(data.profile.name)}
Subject: ${asText(data.profile.subject)}
Current Level: ${asText(data.profile.currentLevel)}
Learning Goals: ${asText(data.profile.learningGoals)}
Weak Areas: ${asText(data.profile.weakAreas)}

SESSION HISTORY
${formatSessions(data.sessions)}

AI REVIEWS
${formatSessions(data.sessions.filter((session) => session.aiReview))}

Return exactly: {"summary":"string"}`;

const parseJson = (text) => {
  if (!text || typeof text !== 'string') {
    throw ApiError.internal('AI response could not be processed.');
  }
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fall through to error
      }
    }
    throw ApiError.internal('AI response could not be processed.');
  }
};

const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

// ── Normalizers ──────────────────────────────────────────────────────────────
// Coerce partial / slightly-off AI responses into the expected shape so we
// don't fail on minor schema deviations (extra fields, wrong counts, etc.).

const normalizePlan = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const objectives = Array.isArray(raw.learningObjectives)
    ? raw.learningObjectives.filter(nonEmptyString).slice(0, 3)
    : [];
  while (objectives.length < 3) objectives.push('Review key concepts from the session topic.');

  const outline = Array.isArray(raw.lessonOutline)
    ? raw.lessonOutline
        .filter((item) => item && (nonEmptyString(item.title) || nonEmptyString(item.description)))
        .slice(0, 4)
        .map((item, idx) => ({
          step: Number.isInteger(item.step) ? item.step : idx + 1,
          title: nonEmptyString(item.title) ? item.title : `Step ${idx + 1}`,
          description: nonEmptyString(item.description) ? item.description : item.title || 'Continue with the lesson.',
        }))
    : [];
  while (outline.length < 4) outline.push({ step: outline.length + 1, title: `Step ${outline.length + 1}`, description: 'Continue with the lesson.' });

  const questions = Array.isArray(raw.practiceQuestions)
    ? raw.practiceQuestions
        .filter((item) => item && nonEmptyString(item.question))
        .slice(0, 3)
        .map((item, idx) => ({
          question: item.question,
          difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : ['easy', 'medium', 'hard'][idx] || 'medium',
        }))
    : [];
  const difficultyFallbacks = ['easy', 'medium', 'hard'];
  while (questions.length < 3) questions.push({ question: 'Solve a practice problem related to the session topic.', difficulty: difficultyFallbacks[questions.length] || 'medium' });

  return { learningObjectives: objectives, lessonOutline: outline, practiceQuestions: questions };
};

const normalizeReview = (raw, homeworkCount = 3) => {
  if (!raw || typeof raw !== 'object') return null;

  const summary = nonEmptyString(raw.summary) ? raw.summary : 'Session completed. Review the covered material.';

  const validDiffs = ['easy', 'medium', 'hard'];
  const diffFallbacks = ['easy', 'medium', 'hard'];
  const count = Math.max(1, Math.min(10, parseInt(homeworkCount, 10) || 3));
  let homework = Array.isArray(raw.homework)
    ? raw.homework
        .filter((item) => item && (nonEmptyString(item.task) || nonEmptyString(item.question) || nonEmptyString(item.description)))
        .slice(0, count)
        .map((item, idx) => ({
          task: item.task || item.question || item.description,
          description: nonEmptyString(item.description) ? item.description : 'Work through the problem carefully, showing all steps.',
          difficulty: validDiffs.includes(item.difficulty) ? item.difficulty : diffFallbacks[idx % diffFallbacks.length],
        }))
    : [];

  while (homework.length < count) {
    const idx = homework.length;
    homework.push({
      task: `Practice problem ${idx + 1} on the session topic: solve and verify your solution step-by-step.`,
      description: 'Focus on the key concepts and methods discussed during the session.',
      difficulty: diffFallbacks[idx % diffFallbacks.length],
    });
  }

  const nextSessionSuggestion = nonEmptyString(raw.nextSessionSuggestion)
    ? raw.nextSessionSuggestion
    : 'Continue with the next topic in the curriculum.';

  return { summary, homework, nextSessionSuggestion };
};

// ── Validators ───────────────────────────────────────────────────────────────
// After normalization these should always pass, but keep as a safety net.

const validatePlan = (value) =>
  value &&
  Array.isArray(value.learningObjectives) && value.learningObjectives.length >= 1 &&
  Array.isArray(value.lessonOutline) && value.lessonOutline.length >= 1 &&
  Array.isArray(value.practiceQuestions) && value.practiceQuestions.length >= 1;

const validateReview = (value) =>
  value &&
  nonEmptyString(value.summary) &&
  Array.isArray(value.homework) && value.homework.length >= 1 &&
  nonEmptyString(value.nextSessionSuggestion);

const validateProgress = (value) => value && nonEmptyString(value.summary);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jitter = (base) => base + Math.floor(Math.random() * (base * 0.3));

const generate = async (prompt, validator, normalizer, maxRetries = 5) => {
  if (!process.env.GEMINI_API_KEY) {
    throw ApiError.internal('AI generation unavailable.');
  }

  let lastError = null;
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: 'application/json' },
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const raw = parseJson(responseText);

      // Normalize first — coerce partial responses into valid shape
      const value = normalizer ? normalizer(raw) : raw;

      if (!validator(value)) {
        // Validation still failed after normalizing — treat as transient and retry
        lastError = new Error('AI response schema mismatch after normalization');
        console.warn(`[Gemini] Attempt ${attempt}: response failed validation, retrying...`);
        if (attempt < maxRetries) {
          await wait(jitter(Math.pow(2, attempt) * 1000));
          continue;
        }
        break;
      }
      return value;
    } catch (error) {
      if (error instanceof ApiError) {
        // parseJson failures (malformed JSON) — retry, don't abort
        lastError = error;
        console.warn(`[Gemini] Attempt ${attempt}: ${error.message}`);
        if (attempt < maxRetries) {
          await wait(jitter(Math.pow(2, attempt) * 1000));
          continue;
        }
        break;
      }
      lastError = error;
      const errMsg = error.message || '';
      const isTransient =
        error.status === 503 || error.status === 429 || error.status === 500 ||
        errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('500') ||
        errMsg.includes('overloaded') || errMsg.includes('high demand') ||
        errMsg.includes('quota') || errMsg.includes('rate limit') ||
        errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('UNAVAILABLE');
      if (isTransient && attempt < maxRetries) {
        const delayMs = jitter(Math.pow(2, attempt) * 1000); // 2s, 4s, 8s, 16s, 32s + jitter
        console.warn(`[Gemini retry] Attempt ${attempt}/${maxRetries} — transient (${error.status || errMsg.slice(0, 60)}). Retrying in ${delayMs}ms...`);
        await wait(delayMs);
        continue;
      }
      break;
    }
  }

  console.error('[Gemini generation failed after all retries]', lastError?.message || lastError);
  throw ApiError.internal('AI generation failed. Please try again in a moment.');
};

module.exports = {
  generateSessionPlan: (data) => generate(buildPlanPrompt(data), validatePlan, normalizePlan),
  generateSessionReview: (data) => {
    const count = Math.max(1, Math.min(10, parseInt(data?.homeworkCount, 10) || 3));
    return generate(
      buildReviewPrompt(data, count),
      validateReview,
      (raw) => normalizeReview(raw, count)
    );
  },
  generateProgressSummary: (data) => generate(buildProgressPrompt(data), validateProgress, null),
};