/**
 * THE CANONICAL DEMO NARRATIVE.
 *
 * This file is authored once and kept byte-identical in both demo repos
 * (`sideline-web-demo` and `sideline-mobile-demo`). It holds the *story* — the
 * people, the calls, the dialogue, the coaching — in shapes that belong to
 * neither app. Each repo then has a thin adapter that maps this into its own
 * types (`lib/demo/store.ts` in both).
 *
 * Why the indirection: opening the same conversation on the phone and on the
 * web and seeing the same rep, the same title and the same transcript is the
 * single most convincing thing these demos do. Two hand-maintained fixture sets
 * would drift within a week.
 *
 * Deliberately small: three reps, one call each. A demo is easier to follow
 * when there is nothing on screen that isn't being talked about.
 *
 * Everything here is fiction. No real person, customer or company.
 *
 * Times are RELATIVE (`daysAgo` + wall-clock), resolved at module load, so the
 * feed always says "Today" and "Yesterday" no matter when the demo is shown.
 */

export type PersonId = "u-dana" | "u-marcus" | "u-priya" | "u-tomas";

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
}

/* ------------------------------------------------------------------------ */
/* People                                                                     */
/* ------------------------------------------------------------------------ */

export const ORGANIZATION = {
  id: "org-northline",
  name: "Northline Home Services",
  slug: "northline-home-services",
} as const;

/**
 * One Admin and three reps.
 *
 * Dana is the manager — she reviews and coaches rather than selling, which is
 * why she has no calls of her own. The three reps are all Users; the roles in
 * this product are only Admin and User, and every rep is a User.
 */
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
];

/** The two personas the in-app switcher toggles between. */
export const ADMIN_PERSON_ID: PersonId = "u-dana";
export const REP_PERSON_ID: PersonId = "u-marcus";

/**
 * WHO THE APP BOOTS AS — the hard-coded "current user".
 *
 * Flip this to `REP_PERSON_ID` to launch straight into the regular-user
 * experience: only their own calls, and no rep filter. It can also be changed
 * at runtime on the Account screen ("Viewing as"), which is the faster way to
 * show both sides during a demo.
 *
 * There is deliberately no second `currentUser` object anywhere — this constant
 * and the persona in the store are the only source of truth.
 */
export const DEFAULT_PERSONA_ID: PersonId = ADMIN_PERSON_ID;

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
 * deriving `endMs` from the next line's start. Writing dialogue with explicit
 * start/end pairs would be unreadable and easy to get wrong.
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
/* Marcus — Hollis Residence, furnace replacement                             */
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
/* Priya — Brennan roof inspection                                            */
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
/* Tomas — Castellanos water heater                                           */
/* ------------------------------------------------------------------------ */

const CASTELLANOS_DURATION = 933; // 15:33

const castellanosUtterances = script(
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
  CASTELLANOS_DURATION,
);

/* ------------------------------------------------------------------------ */
/* The calls — one per rep                                                    */
/* ------------------------------------------------------------------------ */

export const CALLS: DemoCall[] = [
  {
    id: "call-hollis",
    name: "Hollis Residence — Furnace Replacement",
    repId: "u-marcus",
    daysAgo: 0,
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
  },
  {
    id: "call-brennan",
    name: "Brennan Roof Inspection",
    repId: "u-priya",
    daysAgo: 1,
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
        daysAgo: 1,
        hour: 17,
        minute: 40,
        timestampMs: 535_000,
        parentId: null,
      },
      {
        id: "cm-brennan-2",
        authorId: "u-priya",
        body: "Of course. Fair warning, I say 'um' about forty times.",
        daysAgo: 1,
        hour: 18,
        minute: 2,
        timestampMs: null,
        parentId: "cm-brennan-1",
      },
    ],
  },
  {
    id: "call-castellanos",
    name: "Castellanos Water Heater",
    repId: "u-tomas",
    daysAgo: 2,
    hour: 9,
    minute: 50,
    durationSeconds: CASTELLANOS_DURATION,
    status: "ready",
    utterances: castellanosUtterances,
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
      nextSteps: [
        "Thursday installation confirmed.",
        "Send confirmation and arrival window.",
      ],
    },
    // No coaching yet — deliberately, so the Coaching inbox has an example of a
    // call that hasn't been reviewed.
    comments: [],
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
    memberIds: ["u-marcus", "u-priya", "u-tomas"],
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
    activeMembers: 4,
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
 * an empty shell. Used by the mobile app, which is where recording happens.
 */
export const FRESH_CALL_CONTENT: {
  utterances: DemoUtterance[];
  summary: DemoSummary;
  insights: DemoInsights;
} = {
  utterances: script(
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
