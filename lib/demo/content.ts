/**
 * THE CANONICAL DEMO NARRATIVE.
 *
 * This file is authored once and kept byte-identical in both demo repos
 * (`sideline-web-demo` and `sideline-mobile-demo`). It holds the *story* — the
 * people, the calls, the dialogue, the coaching — in shapes that belong to
 * neither app. Each repo then has a thin adapter (`lib/demo/index.ts` on web,
 * `lib/demo/adapt.ts` on mobile) that maps this into that app's own types.
 *
 * Why the indirection: opening the same conversation on the phone and on the
 * web and seeing the same rep, the same title and the same transcript is the
 * single most convincing thing these demos do. Two hand-maintained fixture sets
 * would drift within a week.
 *
 * Everything here is fiction. No real person, customer or company.
 *
 * Times are RELATIVE (`daysAgo` + wall-clock), resolved at module load, so the
 * feed always says "Today" and "Yesterday" no matter when the demo is shown.
 */

export type PersonId =
  | "u-dana"
  | "u-marcus"
  | "u-priya"
  | "u-tomas"
  | "u-sofia";

export interface DemoPerson {
  id: PersonId;
  name: string;
  email: string;
  role: "admin" | "member";
  /** Shown on the account screen; not part of the production model. */
  title: string;
  /** Days ago this person joined, for the account/team screens. */
  joinedDaysAgo: number;
}

export interface DemoUtterance {
  /** Diarization label, exactly as AssemblyAI emits it. */
  speaker: "A" | "B";
  startMs: number;
  endMs: number;
  text: string;
}

export interface DemoSummary {
  participantsContext: string;
  summary: string;
  mainTakeaways: string[];
  nextSteps: string[];
}

export interface DemoInsights {
  outcome: string;
  strengths: string[];
  primaryImprovement: { area: string; suggestion: string };
  objections: string[];
  nextSteps: string[];
  coachingNote: string;
  customerFollowUpDraft: string;
}

export interface DemoComment {
  id: string;
  authorId: PersonId;
  body: string;
  daysAgo: number;
  hour: number;
  minute: number;
  /** Playback offset this message is anchored to, if any. */
  timestampMs: number | null;
  /** Root message id for replies; null for a thread root. */
  parentId: string | null;
}

export type DemoScorecardResult =
  | "met"
  | "partially_met"
  | "not_met"
  | "not_applicable";

export interface DemoScorecardEntry {
  criterionId: string;
  result: DemoScorecardResult;
  explanation: string;
  confidence: number;
}

export interface DemoCall {
  id: string;
  name: string;
  repId: PersonId;
  daysAgo: number;
  hour: number;
  minute: number;
  durationSeconds: number;
  status: "ready" | "processing" | "failed";
  errorMessage?: string;
  /** Rep-authored notes. Only the recording rep may edit these. */
  notes?: string;
  utterances: DemoUtterance[];
  summary?: DemoSummary;
  insights?: DemoInsights;
  comments: DemoComment[];
  scorecard?: DemoScorecardEntry[];
}

/* ------------------------------------------------------------------------ */
/* People                                                                     */
/* ------------------------------------------------------------------------ */

export const ORGANIZATION = {
  id: "org-northline",
  name: "Northline Home Services",
  slug: "northline-home-services",
} as const;

export const PEOPLE: DemoPerson[] = [
  {
    id: "u-dana",
    name: "Dana Whitfield",
    email: "dana@northlinehome.com",
    role: "admin",
    title: "Sales Manager",
    joinedDaysAgo: 412,
  },
  {
    id: "u-marcus",
    name: "Marcus Ellery",
    email: "marcus@northlinehome.com",
    role: "member",
    title: "Field Sales Rep",
    joinedDaysAgo: 260,
  },
  {
    id: "u-priya",
    name: "Priya Raman",
    email: "priya@northlinehome.com",
    role: "member",
    title: "Field Sales Rep",
    joinedDaysAgo: 198,
  },
  {
    id: "u-tomas",
    name: "Tomas Vega",
    email: "tomas@northlinehome.com",
    role: "member",
    title: "Field Sales Rep",
    joinedDaysAgo: 96,
  },
  {
    id: "u-sofia",
    name: "Sofia Brandt",
    email: "sofia@northlinehome.com",
    role: "member",
    title: "Field Sales Rep",
    joinedDaysAgo: 41,
  },
];

/** The two personas the in-app switcher toggles between. */
export const ADMIN_PERSON_ID: PersonId = "u-dana";
export const REP_PERSON_ID: PersonId = "u-marcus";

export function personById(id: string): DemoPerson | undefined {
  return PEOPLE.find((p) => p.id === id);
}

/* ------------------------------------------------------------------------ */
/* Time helpers — everything resolves relative to "now"                       */
/* ------------------------------------------------------------------------ */

const DAY_MS = 86_400_000;

/** Epoch ms for a wall-clock time N days back from today, in LOCAL time. */
export function atDaysAgo(daysAgo: number, hour: number, minute: number): number {
  const d = new Date(Date.now() - daysAgo * DAY_MS);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export function isoDaysAgo(daysAgo: number, hour: number, minute: number): string {
  return new Date(atDaysAgo(daysAgo, hour, minute)).toISOString();
}

/* ------------------------------------------------------------------------ */
/* Transcript helper                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Turns a compact `[speaker, startSeconds, text]` script into utterances,
 * deriving `endMs` from the next line's start. Writing 120 lines of dialogue
 * with explicit start/end pairs would be unreadable and easy to get wrong.
 */
function script(
  lines: [speaker: "A" | "B", startSeconds: number, text: string][],
  totalSeconds: number,
): DemoUtterance[] {
  return lines.map(([speaker, start, text], i) => {
    const next = lines[i + 1];
    const end = next ? next[1] : Math.min(start + 8, totalSeconds);
    return {
      speaker,
      startMs: Math.round(start * 1000),
      endMs: Math.round(end * 1000),
      text,
    };
  });
}

/* ------------------------------------------------------------------------ */
/* Scorecard rubric — mirrors production's "Home Services" template           */
/* ------------------------------------------------------------------------ */

export interface DemoCriterion {
  id: string;
  name: string;
  description: string;
  position: number;
}

export const SCORECARD_NAME = "Home Services";

export const SCORECARD_CRITERIA: DemoCriterion[] = [
  {
    id: "c-rapport",
    name: "Rapport & agenda",
    description:
      "Introduced themselves, set expectations for the visit, and earned permission to proceed.",
    position: 1,
  },
  {
    id: "c-discovery",
    name: "Discovery",
    description:
      "Asked open questions about the home, its history, and what prompted the call.",
    position: 2,
  },
  {
    id: "c-consequence",
    name: "Problem & consequence",
    description:
      "Connected the technical problem to a consequence the homeowner actually cares about.",
    position: 3,
  },
  {
    id: "c-decision-maker",
    name: "Decision-maker confirmation",
    description:
      "Confirmed who else is involved in the decision before presenting pricing.",
    position: 4,
  },
  {
    id: "c-solution",
    name: "Solution presentation",
    description:
      "Presented options clearly, tied to the discovery, without overwhelming detail.",
    position: 5,
  },
  {
    id: "c-trust",
    name: "Differentiation & trust",
    description:
      "Gave a concrete reason to choose this company over a cheaper quote.",
    position: 6,
  },
  {
    id: "c-financing",
    name: "Financing or payment",
    description: "Raised payment options before price became an objection.",
    position: 7,
  },
  {
    id: "c-objections",
    name: "Objection handling",
    description:
      "Acknowledged concerns, clarified them, and responded without becoming defensive.",
    position: 8,
  },
  {
    id: "c-close",
    name: "Closing attempt",
    description: "Made a clear, direct ask for the business.",
    position: 9,
  },
  {
    id: "c-next-step",
    name: "Clear next step",
    description:
      "Left with a specific commitment — a date, a time, and who does what.",
    position: 10,
  },
];

/* ------------------------------------------------------------------------ */
/* Hero call 1 — Hollis Residence, furnace replacement                        */
/* ------------------------------------------------------------------------ */

const HOLLIS_DURATION = 1694; // 28:14

const hollisUtterances = script(
  [
    ["A", 2, "Morning — Marcus with Northline. You must be Mr. Hollis?"],
    ["B", 6, "Ray, yeah. Come on in. Watch the step there, it's a little loose."],
    ["A", 11, "Appreciate it. So before I look at anything — what's been going on with the system?"],
    ["B", 17, "It's just not keeping up. Upstairs is freezing, downstairs is fine. And it's making a noise when it kicks on."],
    ["A", 27, "What kind of noise? Like a rattle, or more of a bang?"],
    ["B", 32, "More of a bang. Like a thump, and then it runs."],
    ["A", 38, "Okay. How long has it been doing that?"],
    ["B", 42, "Since about November, I'd say. Maybe before that, I just didn't notice."],
    ["A", 50, "And how old is the unit, do you know?"],
    ["B", 54, "We bought the house in 2011 and it was here then. The sticker says 2004."],
    ["A", 63, "So we're at twenty-one years. That's — honestly, that's a good run for a furnace."],
    ["B", 71, "That's what the last guy said. He wanted to replace the whole thing right there on the spot."],
    ["A", 79, "I'm not going to do that to you. Let me actually look at it first, and then we'll talk about what makes sense."],
    ["B", 87, "I'd appreciate that."],
    ["A", 92, "Can I ask — is it just the two of you in the house?"],
    ["B", 96, "Me and my wife. Kids are grown. But my daughter's back with the baby right now, upstairs."],
    ["A", 105, "Ah — so the cold room is the one with the baby in it."],
    ["B", 110, "That's the one. That's really why I called."],
    ["A", 116, "That makes a lot more sense now. Okay. Let me go down and take a look."],
    ["A", 340, "Alright. So — the thump you're hearing is delayed ignition. Gas is pooling for a second before it lights."],
    ["B", 352, "Is that dangerous?"],
    ["A", 355, "It's not going to blow up the house. But it's hard on the heat exchanger, and yours already has cracking on the second cell. I took a photo, here."],
    ["B", 368, "Huh. That doesn't look great."],
    ["A", 373, "It's not. And that's the part that matters, because a cracked exchanger is what puts combustion gases into your air. With a newborn upstairs I'm not comfortable telling you to run it another winter."],
    ["B", 389, "So it is a replacement."],
    ["A", 393, "For the furnace, yes. But the upstairs being cold is a separate problem, and I don't want you to pay for a new furnace and still have a cold room."],
    ["B", 404, "Okay, now you've got my attention."],
    ["A", 409, "Your returns are all on the first floor. There's no return upstairs at all. So the new system will push more air up there, but it's got nowhere to pull from."],
    ["B", 424, "Nobody's ever mentioned that."],
    ["A", 428, "It's easy to miss. Fixing it means adding a return in the upstairs hallway. It's drywall work, so it's not nothing, but it's the difference between warm and actually comfortable."],
    ["B", 445, "What are we talking, money-wise?"],
    ["A", 449, "Let me give you three ways to go. Before I do — is your wife part of this decision? I'd rather not make you repeat all this."],
    ["B", 460, "She is, but she trusts me on the house stuff. She'll want to know the number."],
    ["A", 470, "Fair enough. Option one is furnace only, ninety-six percent efficient, same footprint — six thousand two hundred. That solves the safety issue and nothing else."],
    ["B", 487, "And it stays cold upstairs."],
    ["A", 491, "It stays cold upstairs. Option two is the furnace plus the return — seven thousand nine. That's the one I'd pick if it were my house."],
    ["B", 503, "And three?"],
    ["A", 506, "Three is two-stage with a variable blower, plus the return, at nine four. It's quieter and it holds temperature better, but I'll be honest — for a house this size, option two gets you ninety percent of the benefit."],
    ["B", 524, "I appreciate you saying that."],
    ["A", 529, "We do financing too — that middle option is about a hundred and thirty a month at zero percent for sixty months, if that's easier than writing a check."],
    ["B", 541, "Let me think about it and talk to Linda."],
    ["A", 546, "Of course. Can I put you down for Thursday? I'll hold a slot — if you decide against it, you cancel and it costs you nothing."],
    ["B", 558, "Thursday's tight. Let's say I'll call you Wednesday."],
    ["A", 565, "That works. I'll send the three options in writing tonight so Linda can see the same numbers you're looking at."],
    ["B", 574, "That'd be good."],
    ["A", 578, "And Ray — in the meantime, if you smell anything sharp or the CO detector goes off, shut it down and call me directly, not the office."],
    ["B", 589, "Will do. Thanks for being straight with me."],
  ],
  HOLLIS_DURATION,
);

/* ------------------------------------------------------------------------ */
/* Hero call 2 — Brennan roof inspection                                      */
/* ------------------------------------------------------------------------ */

const BRENNAN_DURATION = 2512; // 41:52

const brennanUtterances = script(
  [
    ["A", 3, "Hi, Priya from Northline — thanks for making time. Is now still good?"],
    ["B", 8, "Yeah, come around back, that's where the worst of it is."],
    ["A", 14, "Perfect. So the claim was denied — tell me what the adjuster actually said."],
    ["B", 21, "He said it was wear and tear. Not storm damage. Which, I mean, the shingles were fine before the hail."],
    ["A", 33, "Do you still have the denial letter?"],
    ["B", 37, "Somewhere. I can find it."],
    ["A", 41, "It'd help. The wording matters a lot — 'wear and tear' and 'cosmetic' are two different denials and they get appealed differently."],
    ["B", 52, "I didn't know you could appeal it."],
    ["A", 56, "Most people don't. Let me get up there first and see what we're actually dealing with."],
    ["A", 420, "Okay. So there's hail bruising on the north and west slopes — I marked about thirty hits in a ten-by-ten square."],
    ["B", 434, "Is that a lot?"],
    ["A", 437, "Most carriers use eight to ten in a test square as the threshold. Thirty is well past it. This isn't a close call."],
    ["B", 448, "So why'd he deny it?"],
    ["A", 452, "Sometimes the adjuster only walks the front slope. Yours faces south and it's genuinely fine. The damage is where he'd have had to go around."],
    ["B", 466, "That's frustrating."],
    ["A", 470, "It is. The good news is that's a very appealable denial, because it's a scope problem, not a judgment call."],
    ["B", 480, "What does appealing involve for me?"],
    ["A", 485, "We document it, you request a re-inspection, and I meet the adjuster on the roof. I do about two of these a month."],
    ["B", 497, "And if they say no again?"],
    ["A", 501, "Then we talk about doing it out of pocket, and I'd give you a real number today so you're not deciding blind."],
    ["B", 511, "Go ahead."],
    ["A", 515, "Full tear-off and replace, architectural shingle, thirty-two hundred square feet — twenty-four thousand eight. That includes the ridge vent, which you're missing entirely, by the way."],
    ["B", 532, "Missing?"],
    ["A", 535, "There's no ridge vent. Your attic's venting through two gable vents and that's it. That's part of why the shingles aged the way they did on the back."],
    ["B", 549, "So the wear-and-tear thing isn't totally wrong."],
    ["A", 555, "It's not wrong that there's wear. It's wrong that the hail didn't do damage. Both are true, and the appeal only needs the second one."],
    ["B", 567, "Okay. Let's do the appeal."],
    ["A", 571, "Good. I'll have the photo report to you by tomorrow afternoon, and I'll call the carrier myself to schedule the re-inspect if you'll authorize me to speak with them."],
    ["B", 585, "I'll sign whatever you need."],
  ],
  BRENNAN_DURATION,
);

/* ------------------------------------------------------------------------ */
/* Hero call 3 — Okafor window quote                                          */
/* ------------------------------------------------------------------------ */

const OKAFOR_DURATION = 1117; // 18:37

const okaforUtterances = script(
  [
    ["A", 2, "Mrs. Okafor? Marcus, Northline. Thanks for having me out."],
    ["B", 7, "Of course. We've got three quotes coming this week, I'll be upfront about that."],
    ["A", 13, "That's smart, honestly. Can I ask who else you're having out?"],
    ["B", 19, "Renewal by Andersen was yesterday, and someone local on Friday."],
    ["A", 26, "Okay. What did you think of yesterday's?"],
    ["B", 30, "The number was enormous. Forty-one thousand for nine windows."],
    ["A", 38, "That's on the high side even for them. What are you actually trying to fix — is it drafts, noise, the look?"],
    ["B", 47, "Drafts mostly. The two in the front room are terrible in winter. And they're painted shut."],
    ["A", 56, "Painted shut is a real thing — that's usually a sign the sashes have swelled. Are they original to the house?"],
    ["B", 64, "1978, so I assume so."],
    ["A", 69, "Let me measure and check a couple of things."],
    ["A", 380, "So — here's something. Six of your nine are actually in decent shape. The glazing's tired but the frames are sound."],
    ["B", 392, "The other guy said all nine."],
    ["A", 396, "All nine is more money. But the three that matter are the two in the front room and the one over the sink, and those are the ones you actually notice."],
    ["B", 407, "So what would you do?"],
    ["A", 411, "Replace those three properly — triple pane on the front room since that's your noise side too — and re-glaze the rest. Eleven two total."],
    ["B", 424, "Eleven versus forty-one."],
    ["A", 428, "For a different scope, to be fair. If you want all nine replaced I'd be around twenty-six, and I'd still tell you not to."],
    ["B", 439, "Why wouldn't you want the bigger sale?"],
    ["A", 444, "Because you'd get to year three, nothing would feel different in the six you didn't care about, and you'd tell your neighbours we oversold you."],
    ["B", 456, "That's a fair answer."],
    ["A", 461, "Take the other two quotes. But ask both of them to price the three-window scope as well, so you're comparing the same thing."],
    ["B", 472, "I will. When could you start?"],
    ["A", 477, "Three weeks for the triple pane to come in, then it's a one-day install. If you decide by Friday I can hold the mid-March slot."],
    ["B", 489, "Let me see Friday's quote and I'll call you."],
    ["A", 496, "Sounds good. I'll email the breakdown tonight, both scopes, so you can put them side by side."],
  ],
  OKAFOR_DURATION,
);

/* ------------------------------------------------------------------------ */
/* Short transcripts for the remaining ready calls                            */
/* ------------------------------------------------------------------------ */

function shortScript(
  lines: [speaker: "A" | "B", startSeconds: number, text: string][],
  totalSeconds: number,
): DemoUtterance[] {
  return script(lines, totalSeconds);
}

/* ------------------------------------------------------------------------ */
/* The calls                                                                  */
/* ------------------------------------------------------------------------ */

export const CALLS: DemoCall[] = [
  /* ---------------- Today ---------------- */
  {
    id: "call-okafor",
    name: "Okafor Window Quote",
    repId: "u-marcus",
    daysAgo: 0,
    hour: 9,
    minute: 20,
    durationSeconds: OKAFOR_DURATION,
    status: "ready",
    notes:
      "Third of three quotes — Andersen came in at $41k for all nine. Homeowner is price-anchored high, which helps us. Front room is the real pain point (drafts + street noise).",
    utterances: okaforUtterances,
    summary: {
      participantsContext:
        "Marcus Ellery met Mrs. Okafor at her 1978 home for a window replacement estimate. She is actively collecting three quotes and had already seen a $41,000 bid for nine windows.",
      summary:
        "Marcus reframed the job from a nine-window replacement to a three-window replacement plus re-glazing, on the grounds that only three windows drive the homeowner's actual complaint. He quoted $11,200 for the reduced scope and volunteered a $26,000 number for the full nine while advising against it. He explicitly encouraged her to ask the competing bidders to price the same reduced scope so the comparison is like-for-like.",
      mainTakeaways: [
        "Homeowner is mid-comparison with two other bids; a $41,000 anchor is already set.",
        "Real complaint is drafts and street noise in the front room, not the whole house.",
        "Marcus deliberately quoted a smaller scope than he could have sold.",
        "Decision is gated on Friday's third quote.",
      ],
      nextSteps: [
        "Email both scopes (three-window and full nine) tonight for side-by-side comparison.",
        "Hold the mid-March install slot until Friday.",
        "Follow up after the Friday quote.",
      ],
    },
    insights: {
      outcome: "Quote delivered; decision pending a competing bid on Friday.",
      strengths: [
        "Turned a competitor's high anchor into a credibility opportunity rather than matching it.",
        "Recommended against the larger sale and explained why, which visibly moved the homeowner.",
        "Coached the buyer on how to compare quotes fairly — a strong trust play.",
      ],
      primaryImprovement: {
        area: "Closing attempt",
        suggestion:
          "The scope reframe did the hard work, but the call ended on the homeowner's timeline. A direct ask — 'if Friday's number is higher, do we have a deal?' — would convert this without pressure.",
      },
      objections: [
        "Already has two other quotes in flight.",
        "Sceptical that a smaller scope is not just a bait price.",
      ],
      nextSteps: [
        "Send both scopes in writing tonight.",
        "Confirm the mid-March slot hold.",
      ],
      coachingNote:
        "This is the best discovery-to-scope translation on the team this week. The 'you'd tell your neighbours we oversold you' line is worth stealing.",
      customerFollowUpDraft:
        "Hi Mrs. Okafor — great to meet you this morning. As promised, both scopes are attached: the three-window replacement with triple pane in the front room at $11,200, and the full nine-window replacement at $26,400. I'd still recommend the first. I'm holding a mid-March install slot for you through Friday. — Marcus",
    },
    comments: [
      {
        id: "cm-okafor-1",
        authorId: "u-dana",
        body: "The scope reframe here is excellent. You talked yourself out of $15k and made the sale more likely — that's the whole job.",
        daysAgo: 0,
        hour: 11,
        minute: 42,
        timestampMs: 411_000,
        parentId: null,
      },
      {
        id: "cm-okafor-2",
        authorId: "u-dana",
        body: "One thing though — listen back around the 8 minute mark. She asks 'when could you start' and that's a buying signal. You answered the logistics question but didn't ask for the business.",
        daysAgo: 0,
        hour: 11,
        minute: 44,
        timestampMs: 477_000,
        parentId: null,
      },
    ],
    scorecard: [
      { criterionId: "c-rapport", result: "met", explanation: "Introduced himself and immediately acknowledged the competitive situation without defensiveness.", confidence: 0.94 },
      { criterionId: "c-discovery", result: "met", explanation: "Asked what she was trying to fix before measuring anything, and surfaced drafts plus noise.", confidence: 0.91 },
      { criterionId: "c-consequence", result: "met", explanation: "Tied the front-room windows to the rooms she actually uses in winter.", confidence: 0.82 },
      { criterionId: "c-decision-maker", result: "not_met", explanation: "Never confirmed whether anyone else is involved in the decision.", confidence: 0.88 },
      { criterionId: "c-solution", result: "met", explanation: "Presented two clearly differentiated scopes with a stated recommendation.", confidence: 0.95 },
      { criterionId: "c-trust", result: "met", explanation: "Advised against the larger job and coached her on comparing quotes fairly.", confidence: 0.97 },
      { criterionId: "c-financing", result: "not_met", explanation: "Payment options were never raised.", confidence: 0.9 },
      { criterionId: "c-objections", result: "partially_met", explanation: "Handled the 'why wouldn't you want the bigger sale' challenge well, but did not address the competing bids directly.", confidence: 0.71 },
      { criterionId: "c-close", result: "not_met", explanation: "No direct ask for the business at any point.", confidence: 0.93 },
      { criterionId: "c-next-step", result: "partially_met", explanation: "Agreed to send the quote and hold a slot, but the follow-up date was left to the homeowner.", confidence: 0.79 },
    ],
  },
  {
    id: "call-delgado",
    name: "Delgado HVAC Tune-Up",
    repId: "u-tomas",
    daysAgo: 0,
    hour: 8,
    minute: 5,
    durationSeconds: 725,
    status: "processing",
    utterances: [],
    comments: [],
  },

  /* ---------------- Yesterday ---------------- */
  {
    id: "call-hollis",
    name: "Hollis Residence — Furnace Replacement",
    repId: "u-marcus",
    daysAgo: 1,
    hour: 10,
    minute: 42,
    durationSeconds: HOLLIS_DURATION,
    status: "ready",
    notes:
      "Cracked heat exchanger, second cell. Photos on the tablet. Daughter + newborn staying upstairs — that's the real motivation, not the noise. Wife is Linda, wants to see the numbers. Quoted 6.2 / 7.9 / 9.4. He's calling Wednesday.",
    utterances: hollisUtterances,
    summary: {
      participantsContext:
        "Marcus Ellery visited Ray Hollis, a homeowner with a 21-year-old furnace producing delayed ignition. His daughter and newborn grandchild are currently staying in the upstairs bedroom that will not hold heat.",
      summary:
        "Marcus diagnosed delayed ignition and a cracked second-cell heat exchanger, and documented it photographically. Crucially, he identified that the cold upstairs bedroom is a separate problem — there is no return duct on the second floor — and warned the homeowner that a new furnace alone would not fix it. He presented three options ($6,200 / $7,900 / $9,400), recommended the middle one, and actively steered away from the most expensive. Financing was offered unprompted. The homeowner will consult his wife and call Wednesday.",
      mainTakeaways: [
        "Cracked heat exchanger makes this a safety replacement, not a discretionary upgrade.",
        "A newborn in the affected room is the emotional driver behind the call.",
        "Missing upstairs return is the actual cause of the comfort complaint.",
        "Homeowner had been burned by a previous rep pushing an on-the-spot replacement.",
      ],
      nextSteps: [
        "Email all three options in writing tonight so Linda sees the same numbers.",
        "Expect a call Wednesday.",
        "Hold Thursday install capacity informally.",
      ],
    },
    insights: {
      outcome: "Three options presented; homeowner deciding with spouse, callback Wednesday.",
      strengths: [
        "Refused to quote before diagnosing, directly countering the prior rep's behaviour the homeowner had complained about.",
        "Found and explained the missing return — a problem the homeowner did not know he had.",
        "Steered away from the highest-priced option and said so plainly.",
        "Raised financing before price became an objection.",
      ],
      primaryImprovement: {
        area: "Closing attempt",
        suggestion:
          "The Thursday hold was offered once and dropped the moment the homeowner pushed back. Offering a no-cost hold a second time — framed as protecting his spot, not committing — usually converts here.",
      },
      objections: [
        "Previously pressured by another company for an immediate replacement.",
        "Wants to consult his wife before committing.",
        "Thursday timing felt too soon.",
      ],
      nextSteps: [
        "Send the three-option comparison tonight.",
        "Call Wednesday if the homeowner has not.",
        "Include the heat-exchanger photo in the written quote.",
      ],
      coachingNote:
        "Textbook safety-first diagnosis. The moment he connected the cold room to the newborn, the whole call changed — that's the transferable skill.",
      customerFollowUpDraft:
        "Ray — good to meet you this morning. Attached are the three options we discussed, along with the photo of the cracked exchanger cell so Linda can see what I saw. My recommendation is still the middle option ($7,900), which includes the upstairs return — that's the piece that actually fixes the cold bedroom. Financing works out to about $130/month at 0% for 60 months. Call me directly if anything smells off before then. — Marcus",
    },
    comments: [
      {
        id: "cm-hollis-1",
        authorId: "u-dana",
        body: "Marcus — this is the best call I've listened to this month. Finding the missing return and telling him a new furnace alone wouldn't fix it is exactly right.",
        daysAgo: 1,
        hour: 16,
        minute: 12,
        timestampMs: 409_000,
        parentId: null,
      },
      {
        id: "cm-hollis-2",
        authorId: "u-marcus",
        body: "Thanks. I almost didn't check the returns — he'd already agreed to the replacement at that point so it would have been an easy sale to just take.",
        daysAgo: 1,
        hour: 17,
        minute: 3,
        timestampMs: null,
        parentId: "cm-hollis-1",
      },
      {
        id: "cm-hollis-3",
        authorId: "u-dana",
        body: "That's the point though — you'd have had a callback in February about a cold bedroom and a customer who didn't trust you. Well played.",
        daysAgo: 1,
        hour: 17,
        minute: 20,
        timestampMs: null,
        parentId: "cm-hollis-1",
      },
      {
        id: "cm-hollis-4",
        authorId: "u-dana",
        body: "One coaching point: at 9:06 you offer to hold Thursday, he pushes back, and you drop it immediately. Try offering the hold a second time as a no-obligation thing. 'I'll hold it, cancel any time, costs you nothing.' You'd close a chunk of these on the spot.",
        daysAgo: 0,
        hour: 8,
        minute: 55,
        timestampMs: 546_000,
        parentId: null,
      },
    ],
    scorecard: [
      { criterionId: "c-rapport", result: "met", explanation: "Opened by asking what was happening rather than launching into a pitch.", confidence: 0.96 },
      { criterionId: "c-discovery", result: "met", explanation: "Established symptom, duration, system age, and household composition before diagnosing.", confidence: 0.98 },
      { criterionId: "c-consequence", result: "met", explanation: "Connected the cracked exchanger to combustion gases with a newborn in the house.", confidence: 0.99 },
      { criterionId: "c-decision-maker", result: "met", explanation: "Explicitly asked whether his wife was part of the decision before presenting pricing.", confidence: 0.95 },
      { criterionId: "c-solution", result: "met", explanation: "Three clearly differentiated options with an explicit recommendation.", confidence: 0.97 },
      { criterionId: "c-trust", result: "met", explanation: "Contrasted his approach with the previous rep's on-the-spot pressure, then earned it by diagnosing first.", confidence: 0.93 },
      { criterionId: "c-financing", result: "met", explanation: "Offered 0% for 60 months unprompted, before price resistance appeared.", confidence: 0.94 },
      { criterionId: "c-objections", result: "met", explanation: "Handled the prior-pressure concern by changing his own behaviour rather than arguing.", confidence: 0.88 },
      { criterionId: "c-close", result: "partially_met", explanation: "Asked for Thursday once, then withdrew as soon as the homeowner hesitated.", confidence: 0.85 },
      { criterionId: "c-next-step", result: "partially_met", explanation: "A Wednesday callback was agreed, but the homeowner owns the action, not the rep.", confidence: 0.8 },
    ],
  },
  {
    id: "call-whitaker",
    name: "Whitaker Estimate Follow-Up",
    repId: "u-sofia",
    daysAgo: 1,
    hour: 14,
    minute: 15,
    durationSeconds: 1360,
    status: "ready",
    notes: "Second visit. Husband was there this time, which is what unblocked it.",
    utterances: shortScript(
      [
        ["A", 3, "Thanks for having me back out — I know we did most of this two weeks ago."],
        ["B", 9, "My husband wanted to hear it himself, that's all."],
        ["A", 15, "Completely fair. Should I run through the whole thing again or just the numbers?"],
        ["B", 22, "The numbers, and then the warranty part. That's what he had questions about."],
        ["A", 30, "Sure. Fourteen six for the full system, and the labour warranty is ten years, parts twelve, and that's transferable if you sell."],
        ["B", 42, "Transferable is the part he cared about."],
        ["A", 47, "Most people don't ask. It's worth real money at resale — I'll put it in writing."],
        ["B", 55, "Then I think we're ready to schedule."],
      ],
      1360,
    ),
    summary: {
      participantsContext:
        "Sofia Brandt returned to the Whitaker home for a second visit, this time with both homeowners present.",
      summary:
        "A short follow-up focused on pricing confirmation and warranty terms. The transferable warranty was the deciding factor for the second decision-maker. The homeowners indicated they are ready to schedule.",
      mainTakeaways: [
        "Second decision-maker needed to hear the terms directly.",
        "Transferable warranty was the unlock, not price.",
        "Verbal readiness to schedule.",
      ],
      nextSteps: [
        "Put the transferable warranty terms in writing.",
        "Send the scheduling link.",
      ],
    },
    comments: [
      {
        id: "cm-whitaker-1",
        authorId: "u-dana",
        body: "Good instinct asking whether to re-run the whole thing or just the numbers. Saved everyone twenty minutes.",
        daysAgo: 1,
        hour: 18,
        minute: 5,
        timestampMs: 15_000,
        parentId: null,
      },
    ],
  },
  {
    id: "call-nguyen",
    name: "Nguyen Attic Insulation",
    repId: "u-priya",
    daysAgo: 1,
    hour: 11,
    minute: 30,
    durationSeconds: 558,
    status: "ready",
    utterances: shortScript(
      [
        ["A", 2, "So the reason your bills jumped isn't the furnace — it's up here."],
        ["B", 8, "It's just insulation, isn't it?"],
        ["A", 12, "It was. It's about four inches now, and it's compressed. You want fourteen."],
        ["B", 20, "Four to fourteen. That's a big gap."],
        ["A", 25, "It settles over thirty years. Blown-in on top of what's there, twenty-eight hundred, one day."],
        ["B", 34, "And that actually shows up on the bill?"],
        ["A", 38, "For a house this age, most people see fifteen to twenty percent in winter. I won't promise a number."],
        ["B", 47, "Send me something in writing."],
      ],
      558,
    ),
    summary: {
      participantsContext:
        "Priya Raman inspected the attic at the Nguyen residence following a complaint about rising heating bills.",
      summary:
        "Priya identified compressed, under-depth attic insulation as the cause rather than the HVAC system. She quoted $2,800 for blown-in insulation to R-49 depth and declined to guarantee a specific savings figure.",
      mainTakeaways: [
        "Root cause is insulation depth, not equipment.",
        "Rep avoided over-promising savings.",
        "Homeowner requested written follow-up.",
      ],
      nextSteps: ["Send written quote.", "Include a typical savings range, not a guarantee."],
    },
    comments: [],
  },

  /* ---------------- Two days ago ---------------- */
  {
    id: "call-brennan",
    name: "Brennan Roof Inspection",
    repId: "u-priya",
    daysAgo: 2,
    hour: 13,
    minute: 5,
    durationSeconds: BRENNAN_DURATION,
    status: "ready",
    notes:
      "Claim denied as wear-and-tear. ~30 hail hits per 10x10 on north and west slopes — adjuster almost certainly only walked the south face. No ridge vent at all. Appeal first, $24.8k as fallback.",
    utterances: brennanUtterances,
    summary: {
      participantsContext:
        "Priya Raman inspected the Brennan roof after the homeowner's hail claim was denied by their insurance carrier as wear and tear.",
      summary:
        "Priya documented roughly thirty hail impacts per ten-by-ten test square on the north and west slopes — well above the eight-to-ten threshold most carriers use — and concluded the adjuster likely only inspected the south-facing slope. She recommended appealing on scope grounds, offered to meet the re-inspecting adjuster on the roof, and separately quoted $24,800 for a full replacement as a fallback. She also disclosed that the roof has no ridge vent, conceding that some of the carrier's wear finding is legitimate.",
      mainTakeaways: [
        "Denial appears to be a scope failure, not a judgment call — highly appealable.",
        "Hail damage is 3x the typical carrier threshold.",
        "Roof has no ridge vent; attic ventilation is inadequate.",
        "Homeowner authorised Priya to speak with the carrier.",
      ],
      nextSteps: [
        "Deliver the photo report by tomorrow afternoon.",
        "Get written authorisation to contact the carrier.",
        "Schedule the re-inspection and attend it.",
      ],
    },
    insights: {
      outcome: "Homeowner committed to appealing the denial with Priya representing.",
      strengths: [
        "Quantified the damage against the carrier's own threshold instead of asserting it.",
        "Volunteered that part of the carrier's wear finding was correct, which made the rest credible.",
        "Offered to attend the re-inspection personally.",
      ],
      primaryImprovement: {
        area: "Financing or payment",
        suggestion:
          "A $24,800 fallback was quoted with no payment options attached. If the appeal fails, that number lands cold. Introduce financing alongside the fallback, not after it.",
      },
      objections: [
        "Carrier has already denied the claim once.",
        "Uncertainty about what happens if the appeal fails.",
      ],
      nextSteps: [
        "Photo report tomorrow.",
        "Carrier authorisation form.",
        "Re-inspection scheduling.",
      ],
      coachingNote:
        "Conceding the ridge-vent point was the strongest move in the call. Reps who argue every point lose the ones that matter.",
      customerFollowUpDraft:
        "Hi — attached is the full photo report from today's inspection, including the test-square documentation showing roughly 30 hail impacts per 10x10 on the north and west slopes. I've also included the authorisation form so I can speak with your carrier directly and attend the re-inspection. — Priya",
    },
    comments: [
      {
        id: "cm-brennan-1",
        authorId: "u-dana",
        body: "Admitting the ridge vent issue was the right call and I want the rest of the team to hear how you did it. Can I use this clip in Monday's meeting?",
        daysAgo: 2,
        hour: 17,
        minute: 40,
        timestampMs: 535_000,
        parentId: null,
      },
      {
        id: "cm-brennan-2",
        authorId: "u-priya",
        body: "Of course. Fair warning, I say 'um' about forty times.",
        daysAgo: 2,
        hour: 18,
        minute: 2,
        timestampMs: null,
        parentId: "cm-brennan-1",
      },
    ],
    scorecard: [
      { criterionId: "c-rapport", result: "met", explanation: "Confirmed timing and moved straight to the homeowner's stated problem.", confidence: 0.9 },
      { criterionId: "c-discovery", result: "met", explanation: "Asked for the denial letter and probed the exact wording used.", confidence: 0.93 },
      { criterionId: "c-consequence", result: "partially_met", explanation: "Explained the damage thoroughly but spent little time on what happens if it goes unrepaired.", confidence: 0.74 },
      { criterionId: "c-decision-maker", result: "not_met", explanation: "No confirmation of who else is involved in the decision.", confidence: 0.86 },
      { criterionId: "c-solution", result: "met", explanation: "Clear two-path plan: appeal first, replacement quote as fallback.", confidence: 0.92 },
      { criterionId: "c-trust", result: "met", explanation: "Conceded the ventilation deficiency, which strengthened the hail argument.", confidence: 0.96 },
      { criterionId: "c-financing", result: "not_met", explanation: "The $24,800 fallback was presented with no payment options.", confidence: 0.91 },
      { criterionId: "c-objections", result: "met", explanation: "Directly addressed 'why did he deny it' and 'what if they say no again'.", confidence: 0.89 },
      { criterionId: "c-close", result: "met", explanation: "Secured a decision to appeal and authorisation to represent.", confidence: 0.87 },
      { criterionId: "c-next-step", result: "met", explanation: "Specific deliverable, owner and deadline agreed.", confidence: 0.94 },
    ],
  },
  {
    id: "call-castellanos",
    name: "Castellanos Water Heater",
    repId: "u-tomas",
    daysAgo: 2,
    hour: 9,
    minute: 50,
    durationSeconds: 933,
    status: "ready",
    utterances: shortScript(
      [
        ["A", 2, "You said it's leaking — is it dripping or is there standing water?"],
        ["B", 7, "There's a puddle. It's been there a few days."],
        ["A", 12, "Okay, let me look at where it's coming from, because that changes everything."],
        ["A", 200, "It's the tank, not a fitting. That's not repairable."],
        ["B", 208, "How long do I have?"],
        ["A", 212, "Days, realistically. When it goes it'll empty forty gallons onto that floor."],
        ["B", 220, "That's the finished basement."],
        ["A", 224, "That's why I'd do it this week. Standard fifty-gallon, installed, eighteen fifty. I can do Thursday."],
        ["B", 235, "Do Thursday."],
      ],
      933,
    ),
    summary: {
      participantsContext:
        "Tomas Vega responded to a water heater leak at the Castellanos home, above a finished basement.",
      summary:
        "Tomas determined the leak was from the tank itself rather than a fitting, making it unrepairable. He framed the urgency around the risk to the finished basement below and closed a Thursday installation at $1,850 on the spot.",
      mainTakeaways: [
        "Tank failure, not a serviceable fitting.",
        "Finished basement below created genuine urgency.",
        "Closed same-visit.",
      ],
      nextSteps: ["Thursday installation confirmed.", "Send confirmation and arrival window."],
    },
    comments: [],
  },
  {
    id: "call-ferraro",
    name: "Ferraro Siding Walkthrough",
    repId: "u-sofia",
    daysAgo: 2,
    hour: 15,
    minute: 45,
    durationSeconds: 1987,
    status: "failed",
    errorMessage:
      "Transcription failed: the uploaded audio contains no detectable speech in the first 4 minutes. This usually means the microphone was obstructed or the device was in a pocket.",
    utterances: [],
    comments: [],
  },

  /* ---------------- Four days ago ---------------- */
  {
    id: "call-ibarra",
    name: "Ibarra Duct Cleaning",
    repId: "u-marcus",
    daysAgo: 4,
    hour: 8,
    minute: 40,
    durationSeconds: 464,
    status: "ready",
    utterances: shortScript(
      [
        ["A", 2, "Before we talk duct cleaning — has anyone in the house started having allergy symptoms, or is this preventative?"],
        ["B", 9, "My son. Since we moved in, honestly."],
        ["A", 15, "How long ago was that?"],
        ["B", 18, "Eight months."],
        ["A", 22, "Then I'd want to look at the ducts, but I'd also want to check whether there's moisture, because eight months of symptoms in a new house is usually not dust."],
        ["B", 33, "Nobody's mentioned moisture."],
        ["A", 37, "Might be nothing. But cleaning ducts that have a moisture problem just means you clean them again next year."],
        ["B", 46, "Go ahead and check."],
      ],
      464,
    ),
    summary: {
      participantsContext:
        "Marcus Ellery was called for a duct cleaning quote and instead investigated a possible underlying cause.",
      summary:
        "Rather than quoting the requested service, Marcus probed why the homeowner wanted it and surfaced eight months of allergy symptoms in a child since moving in. He advised checking for moisture before cleaning, on the grounds that cleaning alone would not resolve a moisture-driven problem.",
      mainTakeaways: [
        "Requested service may not address the actual problem.",
        "Eight months of symptoms suggests moisture, not dust.",
        "Homeowner agreed to a moisture inspection.",
      ],
      nextSteps: ["Complete the moisture inspection.", "Re-quote based on findings."],
    },
    comments: [],
  },
  {
    id: "call-lindqvist",
    name: "Lindqvist Solar Consult",
    repId: "u-priya",
    daysAgo: 4,
    hour: 12,
    minute: 10,
    durationSeconds: 1579,
    status: "ready",
    utterances: shortScript(
      [
        ["A", 3, "What's driving the interest — is it the bills, or is it more the environmental side?"],
        ["B", 10, "Both, but mostly we just got a quote for a new roof and figured we'd do it all at once."],
        ["A", 19, "That's the right order to think about it. You never want panels on a roof that's about to be replaced."],
        ["B", 28, "That's what I thought."],
        ["A", 32, "How old is the roof?"],
        ["B", 35, "Nineteen years."],
        ["A", 39, "Then yes, roof first, absolutely. And if you do both together the mounting goes on during the roof install, which saves you about two thousand."],
        ["B", 50, "Nobody told me that either."],
      ],
      1579,
    ),
    summary: {
      participantsContext:
        "Priya Raman consulted with the Lindqvist household about a solar installation alongside a planned roof replacement.",
      summary:
        "Priya confirmed the homeowners' instinct to replace the 19-year-old roof before installing panels, and identified roughly $2,000 in savings from sequencing the mounting hardware during the roof install rather than after.",
      mainTakeaways: [
        "Roof is 19 years old — must precede solar.",
        "Combined scheduling saves approximately $2,000.",
        "Homeowners are motivated by both cost and environmental factors.",
      ],
      nextSteps: ["Coordinate a combined roof-and-solar timeline.", "Provide a combined quote."],
    },
    comments: [],
  },

  /* ---------------- Six days ago ---------------- */
  {
    id: "call-ashford",
    name: "Ashford Gutter Replacement",
    repId: "u-tomas",
    daysAgo: 6,
    hour: 10,
    minute: 25,
    durationSeconds: 1142,
    status: "ready",
    utterances: shortScript(
      [
        ["A", 2, "The overflow you're seeing — is it all the way around or just this corner?"],
        ["B", 8, "Just this corner, but it's been doing it for years."],
        ["A", 14, "That's a pitch issue then, not a capacity issue. You may not need all new gutters."],
        ["B", 22, "The last company said full replacement."],
        ["A", 27, "You might get there eventually. But re-hanging this run is four hundred, and full replacement is thirty-two hundred."],
        ["B", 37, "Start with the four hundred."],
        ["A", 41, "That's what I'd do. If it's still overflowing after a real storm, call me and we'll credit it toward the bigger job."],
      ],
      1142,
    ),
    summary: {
      participantsContext:
        "Tomas Vega assessed a localised gutter overflow at the Ashford property.",
      summary:
        "Tomas diagnosed a pitch problem affecting a single run rather than a capacity problem requiring full replacement, contradicting a previous company's recommendation. He proposed a $400 re-hang over a $3,200 replacement and offered to credit the smaller job toward the larger one if it proved insufficient.",
      mainTakeaways: [
        "Localised pitch issue, not system-wide failure.",
        "Previous vendor recommended an unnecessary full replacement.",
        "Credit-forward offer removed the risk of starting small.",
      ],
      nextSteps: ["Schedule the re-hang.", "Follow up after the next significant storm."],
    },
    comments: [],
  },
  {
    id: "call-moreau",
    name: "Moreau Heat Pump Assessment",
    repId: "u-sofia",
    daysAgo: 6,
    hour: 14,
    minute: 55,
    durationSeconds: 1908,
    status: "ready",
    utterances: shortScript(
      [
        ["A", 3, "You mentioned on the phone you're thinking about a heat pump — what prompted that?"],
        ["B", 9, "The rebate. It expires in March, apparently."],
        ["A", 15, "It does. Though I'd rather you get the right system than the rebated one, if those turn out to be different."],
        ["B", 24, "Are they?"],
        ["A", 27, "Depends on your ductwork. Heat pumps move more air at a lower temperature, so undersized ducts that work fine with a furnace can be noisy and uneven with a pump."],
        ["B", 40, "And mine?"],
        ["A", 43, "Mostly fine. The run to the back bedroom is undersized. I'd want to fix that as part of it, not after."],
        ["B", 52, "Price it both ways for me."],
      ],
      1908,
    ),
    summary: {
      participantsContext:
        "Sofia Brandt assessed the Moreau home for a heat pump conversion driven by an expiring March rebate.",
      summary:
        "Sofia cautioned against letting the rebate deadline drive the system choice and explained how heat pump airflow characteristics interact with existing ductwork. She identified an undersized run to the back bedroom and recommended addressing it as part of the installation rather than afterwards.",
      mainTakeaways: [
        "Rebate deadline is the primary motivator — a timing risk.",
        "Undersized duct run to the back bedroom needs correcting.",
        "Homeowner requested pricing both with and without duct work.",
      ],
      nextSteps: [
        "Provide two quotes: with and without the duct correction.",
        "Confirm the rebate deadline in writing.",
      ],
    },
    comments: [
      {
        id: "cm-moreau-1",
        authorId: "u-dana",
        body: "Nice work not letting the rebate rush the sizing conversation. That's how we end up with callbacks in July.",
        daysAgo: 5,
        hour: 9,
        minute: 15,
        timestampMs: 15_000,
        parentId: null,
      },
    ],
  },
];

/* ------------------------------------------------------------------------ */
/* Mobile-only local rows — recordings that never reached the server          */
/* ------------------------------------------------------------------------ */

/**
 * These exist only on the device, so they appear in the mobile feed and nowhere
 * on the web. They exist to make the failure-state labels reachable without
 * waiting for anything: "Upload failed — tap to retry" and "Interrupted — tap
 * to retry".
 */
export interface DemoLocalOnlyRecording {
  id: string;
  name: string;
  repId: PersonId;
  daysAgo: number;
  hour: number;
  minute: number;
  durationSeconds: number;
  kind: "upload_failed" | "interrupted";
}

export const LOCAL_ONLY_RECORDINGS: DemoLocalOnlyRecording[] = [
  {
    id: "local-upload-failed",
    name: "Pearson Driveway Estimate",
    repId: "u-marcus",
    daysAgo: 0,
    hour: 7,
    minute: 35,
    durationSeconds: 612,
    kind: "upload_failed",
  },
  {
    id: "local-interrupted",
    name: "Vasquez Chimney Look",
    repId: "u-marcus",
    daysAgo: 1,
    hour: 16,
    minute: 48,
    durationSeconds: 244,
    kind: "interrupted",
  },
];

/* ------------------------------------------------------------------------ */
/* Teams                                                                      */
/* ------------------------------------------------------------------------ */

export interface DemoTeam {
  id: string;
  name: string;
  memberIds: PersonId[];
  managerIds: PersonId[];
}

export const TEAMS: DemoTeam[] = [
  {
    id: "team-north",
    name: "North Territory",
    memberIds: ["u-marcus", "u-priya"],
    managerIds: ["u-dana"],
  },
  {
    id: "team-south",
    name: "South Territory",
    memberIds: ["u-tomas", "u-sofia"],
    managerIds: ["u-dana"],
  },
];

/* ------------------------------------------------------------------------ */
/* Other organizations — for the platform-owner provisioning console          */
/* ------------------------------------------------------------------------ */

export interface DemoOrganization {
  id: string;
  name: string;
  slug: string;
  status: "active" | "disabled";
  activeMembers: number;
  createdDaysAgo: number;
}

export const ORGANIZATIONS: DemoOrganization[] = [
  {
    id: ORGANIZATION.id,
    name: ORGANIZATION.name,
    slug: ORGANIZATION.slug,
    status: "active",
    activeMembers: 5,
    createdDaysAgo: 412,
  },
  {
    id: "org-cascade",
    name: "Cascade Comfort Systems",
    slug: "cascade-comfort-systems",
    status: "active",
    activeMembers: 12,
    createdDaysAgo: 188,
  },
  {
    id: "org-harbor",
    name: "Harbor Point Exteriors",
    slug: "harbor-point-exteriors",
    status: "disabled",
    activeMembers: 3,
    createdDaysAgo: 64,
  },
];

/* ------------------------------------------------------------------------ */
/* The call a simulated recording turns into                                  */
/* ------------------------------------------------------------------------ */

/**
 * When the demo "finishes" a recording, the scripted pipeline eventually
 * attaches this content so the new call opens onto something real rather than
 * an empty shell.
 */
export const FRESH_CALL_CONTENT: {
  utterances: DemoUtterance[];
  summary: DemoSummary;
  insights: DemoInsights;
} = {
  utterances: shortScript(
    [
      ["A", 2, "Thanks for making time this morning — before I look at anything, tell me what's been happening."],
      ["B", 9, "It's the noise mostly. And the upstairs never gets warm."],
      ["A", 16, "How long has the noise been going on?"],
      ["B", 20, "A couple of months. My wife noticed it first."],
      ["A", 26, "Okay. And has anyone been out to look at it yet?"],
      ["B", 31, "One company. They quoted a full replacement without going in the crawlspace."],
      ["A", 39, "I'd like to actually get under there before I tell you anything. Is that alright?"],
      ["B", 45, "Please."],
      ["A", 49, "Give me fifteen minutes and I'll come back with photos either way."],
    ],
    300,
  ),
  summary: {
    participantsContext:
      "A first visit to a homeowner reporting system noise and inconsistent upstairs heating, following a competing quote given without inspection.",
    summary:
      "The rep opened with discovery rather than a pitch, established the symptom timeline, and learned a competitor had quoted a full replacement without inspecting the crawlspace. The rep committed to inspecting and returning with photographic evidence before making any recommendation.",
    mainTakeaways: [
      "Homeowner has already received a no-inspection quote from a competitor.",
      "Two distinct complaints: noise and uneven upstairs heating.",
      "Rep deferred all recommendations until after inspection.",
    ],
    nextSteps: [
      "Complete the crawlspace inspection and document with photos.",
      "Return with findings before quoting.",
    ],
  },
  insights: {
    outcome: "Discovery completed; inspection in progress, no quote given yet.",
    strengths: [
      "Refused to quote before inspecting, directly differentiating from the competitor.",
      "Established symptom duration and who noticed it first.",
      "Promised photographic evidence either way, not just when it supports a sale.",
    ],
    primaryImprovement: {
      area: "Decision-maker confirmation",
      suggestion:
        "The homeowner mentioned a wife who noticed the problem first. Worth confirming whether she should be present for the findings conversation.",
    },
    objections: ["Already has a competing quote in hand."],
    nextSteps: ["Complete inspection.", "Return with photos and findings."],
    coachingNote:
      "Strong open. The 'photos either way' commitment is a good habit — it costs nothing and it is the thing homeowners remember.",
    customerFollowUpDraft:
      "Thanks for your time this morning. As promised, I've attached the photos from the crawlspace inspection along with what I found. Happy to walk through it whenever suits you both.",
  },
};
