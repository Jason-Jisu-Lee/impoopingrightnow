export const masterWordBank = {
  fake_user_feed: [
    "you got this",
    "almost there",
    "breathe",
    "stay with it",
    "keep going",
    "hang tight",
    "trust the process",
    "nearly done",
    "you're doing great",
    "hold on",
    "so close",
    "worth it",
    "don't give up",
    "you've got it",
    "push through",
    "stay focused",
    "one more minute",
    "believe in yourself",
    "it passes",
    "you're not alone",
    "we're rooting for you",
    "stay calm",
    "relax",
    "deep breaths",
    "almost",
    "persevere",
    "you can do it",
    "keep at it",
    "stay strong",
    "it's worth it",
    "just relax",
    "you'll get there",
    "patience pays",
    "it always works out",
    "the body knows",
    "let gravity help",
    "just breathe",
    "your time is coming",
    "trust your gut",
    "you're a champ",
    "soldier on",
    "the struggle is real",
    "been there",
    "solidarity",
    "we all poop",
    "this too shall pass",
    "nature's on your side",
    "stay the course",
    "don't rush it",
    "i believe in you",
  ],

  certificate_results: {
    /* New schema: each category contains named sub-ranges; each sub-range
       holds an array of CertHeadlineEntry { headline, sealLabels[3], sublines[5] }.
       Selector logic lives in session-runtime.ts.
       Content for each category is filled in batch-by-batch. */

    milestone_pooped: {
      // three (1) — early consistency milestone
      three: [
        {
          headline: "Three-Peat Confirmed — A Pattern Emerges",
          sealLabels: [
            "📊 3 Logged Sessions",
            "🌱 Habit Forming",
            "✅ Consistency Initiated",
          ],
          sublines: [
            "{poopedCount} sessions logged. Three is no accident. Three is a habit.",
            "You've now pooped here three times. The app is starting to recognize you.",
            "Achievement: 'The Trifecta Foundation'.",
            "Top 60% of users make it past three. Welcome to the persistent class.",
            "Three sessions = data. You are no longer a fluke. You are a trend.",
          ],
        },
      ],
      // ten (1) — double-digit territory
      ten: [
        {
          headline: "Double-Digit Voider — Welcome to the Tens",
          sealLabels: [
            "🔟 10 Sessions Logged",
            "🏅 Decagon-Tier Member",
            "📈 Statistically Reliable",
          ],
          sublines: [
            "{poopedCount} sessions. You crossed into double digits. There is no going back.",
            "Achievement: 'Decade of Devotion (Sessions Edition)'.",
            "Top 30% of users hit ten logged sessions. You're committed now.",
            "The app has officially noticed you. The leaderboard is taking notes.",
            "Ten poops in. The bowel-data continuum thanks you.",
          ],
        },
      ],
      // fifty (1) — serious commitment
      fifty: [
        {
          headline: "Half-Century Voider",
          sealLabels: [
            "5️⃣0️⃣ 50 Sessions Logged",
            "🏆 Veteran Status Unlocked",
            "💎 Bowel Connoisseur",
          ],
          sublines: [
            "{poopedCount} sessions. Fifty. Five-zero. The data is now a memoir.",
            "Achievement: 'Half-Century of Honest Work'.",
            "Top 10% of users ever reach 50 logged sessions. You are them.",
            "If pooping had a Hall of Fame, you'd be a candidate.",
            "Fifty sessions. Your colon has its own podcast at this point.",
          ],
        },
      ],
      // hundred (1) — legendary
      hundred: [
        {
          headline: "Centurion of the Porcelain Order",
          sealLabels: [
            "💯 100 Sessions Logged",
            "🏛 Legend-Tier Voider",
            "👑 Bowel Royalty",
          ],
          sublines: [
            "{poopedCount} sessions. One hundred. The number that ends arguments.",
            "Achievement: 'Centurion — Knight of the Bowl'.",
            "Top 1% of users ever reach 100 logged sessions. You are mythology.",
            "A century of sit-downs. Historians will write about this.",
            "100 poops, all logged, all yours. This is what immortality smells like.",
          ],
        },
      ],
    },
    milestone_streak: {
      // five (1)
      five: [
        {
          headline: "Five-Day Streak Locked In",
          sealLabels: [
            "🔥 5-Day Streak",
            "📅 Consistent Voider",
            "✅ Habit Established",
          ],
          sublines: [
            "{streak}-day streak. Five consecutive days of bowel professionalism.",
            "Achievement: 'The First Workweek'.",
            "Top 40% of users hit a 5-day streak. You belong.",
            "Five days. The body now expects this. Do not betray it.",
            "Streak intact. Discipline confirmed.",
          ],
        },
      ],
      // ten (1)
      ten: [
        {
          headline: "Ten-Day Streak — Habit Hardened",
          sealLabels: [
            "🔥 10-Day Streak",
            "📈 Reliability Locked",
            "💪 Disciplined Voider",
          ],
          sublines: [
            "{streak}-day streak. Double digits. The streak is now load-bearing.",
            "Achievement: 'Ten Days of Trust'.",
            "Top 25% of users hit a 10-day streak. Welcome.",
            "Ten consecutive days. The colon is operating on schedule.",
            "Streak: stable. Identity: solidified.",
          ],
        },
      ],
      // twenty (1)
      twenty: [
        {
          headline: "Twenty-Day Streak — Lifestyle Confirmed",
          sealLabels: [
            "🔥 20-Day Streak",
            "🏅 Disciplined Veteran",
            "🎯 Locked-In Habit",
          ],
          sublines: [
            "{streak}-day streak. Twenty. This is no longer a habit. This is who you are.",
            "Achievement: 'Three Weeks of Truth'.",
            "Top 15% of users hit a 20-day streak. Elite zone.",
            "Twenty days. The bowel has memorized your routine.",
            "Streak compounding. Identity solidifying. Bowl warming.",
          ],
        },
      ],
      // thirty (1)
      thirty: [
        {
          headline: "Thirty-Day Streak — Monthly Voider",
          sealLabels: [
            "🔥 30-Day Streak",
            "🗓 Full Month Logged",
            "🏆 Monthly Discipline Award",
          ],
          sublines: [
            "{streak}-day streak. A full month of perfect attendance.",
            "Achievement: 'The Calendar Crusher'.",
            "Top 8% of users reach a 30-day streak. You're rare air.",
            "Thirty consecutive days. The toilet has a parking spot reserved.",
            "Streak: monthly. Status: distinguished.",
          ],
        },
      ],
      // fifty (1)
      fifty: [
        {
          headline: "Fifty-Day Streak — Half-Century of Discipline",
          sealLabels: [
            "🔥 50-Day Streak",
            "💎 Streak Connoisseur",
            "🏛 Veteran Streak Holder",
          ],
          sublines: [
            "{streak}-day streak. Fifty. The streak is now a permanent feature.",
            "Achievement: 'The Fifty-Day Citadel'.",
            "Top 3% of users ever reach a 50-day streak. You are nearly mythological.",
            "Fifty consecutive days. Your gut has filed for tenure.",
            "Streak: monumental. Bowel: loyal. You: legend-adjacent.",
          ],
        },
      ],
      // hundred (1)
      hundred: [
        {
          headline: "ONE HUNDRED CONSECUTIVE DAYS — Streak Immortal",
          sealLabels: [
            "🔥💯 100-Day Streak",
            "👑 Bowel Royalty Confirmed",
            "🏛 Streak Hall of Fame",
          ],
          sublines: [
            "{streak}-day streak. One hundred consecutive days of perfect output. This is mythology.",
            "Achievement: 'The Centurion Streak — Crown of the Porcelain Throne'.",
            "Top 0.5% of users ever achieve a 100-day streak. You are folklore.",
            "100 days. Historians will reference this era as 'The Reign of the Reliable'.",
            "Streak immortalized. Bowel sanctified. Toilet renamed in your honor.",
          ],
        },
      ],
    },
    push_timer: {
      // under_4s (7) — gloriously fast pushes
      under_4s: [
        {
          headline: "The Drive-By Drop",
          sealLabels: [
            "⚡ Sub-4 Second Push",
            "🎯 Surgical Strike",
            "🚀 Zero-Effort Excellence",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. The colon obeyed without resistance.",
            "Top 2% of pushes ever recorded on this app.",
            "Frictionless. Effortless. Borderline rude to the toilet.",
            "Gravity did most of the work. You're welcome, gravity.",
            "Below global average push time. Suspiciously efficient. 😭",
          ],
        },
        {
          headline: "Hydraulic Bypass Activated",
          sealLabels: [
            "💧 Lubricated Lineage",
            "🛝 The Slip n' Slide",
            "🌊 Tidal Cooperation",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Smoother than fresh asphalt.",
            "You unlocked the achievement: Frictionless Voider.",
            "Engineers couldn't design a better delivery system.",
            "Whatever you ate, please write a memoir about it.",
            "Below global average strain by ~80%. 😭 (it's a flex.)",
          ],
        },
        {
          headline: "Speedrun Any% Glitchless",
          sealLabels: [
            "🏁 Sub-4 Sprint",
            "🎮 Frame-Perfect Push",
            "⏱ World Record Attempt",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. The leaderboard has been notified.",
            "You exited the bathroom faster than your coworker can say 'meeting'.",
            "Top 1% velocity tier. Speedrun community is taking notice.",
            "If pooping were an Olympic sport, this is a qualifier.",
            "Below global average push duration by ~85%. Disgustingly fast. 😭",
          ],
        },
        {
          headline: "The Single-Push Wonder",
          sealLabels: [
            "1️⃣ One and Done",
            "✨ Single-Stroke Mastery",
            "🎯 Bullseye Bowel",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. No follow-ups required.",
            "Achievement unlocked: First-Try Finisher.",
            "Most people need 3+ attempts. You needed one breath.",
            "Decisive. Final. Unilateral.",
            "Top 5% of efficient outputs. Bowel of legend.",
          ],
        },
        {
          headline: "Frictionless Pioneer",
          sealLabels: [
            "🛢 Well-Oiled Machine",
            "🧈 Buttery Smooth Egress",
            "💨 Vacuum-Sealed Ejection",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. The plumbing barely noticed.",
            "Top 3% of users by push speed.",
            "Whoever raised you fed you well. Send them a thank-you note.",
            "Achievement: 'Greased Lightning'.",
            "Below global average strain by a country mile. 😭",
          ],
        },
        {
          headline: "Zero-Drama Departure",
          sealLabels: [
            "🎭 No Theatrics",
            "📉 Minimal Effort Deployment",
            "🪶 Featherlight Exit",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Quiet, clean, professional.",
            "No grunting. No bracing. No witnesses required.",
            "Top 4% efficiency tier this week.",
            "You make it look easy because, statistically, it was.",
            "Below global average push time. The bowels held a vote and you won unanimously.",
          ],
        },
        {
          headline: "Effortless Delegation",
          sealLabels: [
            "🤝 Trusted the Process",
            "🎁 Gift From Within",
            "🍃 Whisper-Light Output",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. You barely participated.",
            "The body did the thinking. You just sat there.",
            "Top 5% of low-effort sessions globally.",
            "If pooping had a Tinder, you'd be left-swiped for being too easy.",
            "Below global strain average. Embarrassingly graceful. 😭",
          ],
        },
      ],
      // s10_15 (5) — solid, healthy push range
      s10_15: [
        {
          headline: "Textbook Execution",
          sealLabels: [
            "📘 Gastrointestinal Excellence",
            "🎓 Honors Bowel Movement",
            "✅ Clinically Approved",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. A gastroenterologist would weep.",
            "Top 25% of push efficiency this week.",
            "Achievement unlocked: 'Wholesome Voider'.",
            "Healthy. Dignified. Statistically beautiful.",
            "You are the recommended daily allowance of poop.",
          ],
        },
        {
          headline: "The Steady Hand",
          sealLabels: [
            "🪨 Composed Under Pressure",
            "🎼 Perfectly Tempo'd",
            "🏛 Pillar of Regularity",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. No rush. No drama. Just craft.",
            "Top 30% of users by push poise.",
            "This is the push your colon writes home about.",
            "Achievement: 'Reliable Output'.",
            "Below global average strain by ~40%. Composed king/queen behavior.",
          ],
        },
        {
          headline: "The Bowel Whisperer",
          sealLabels: [
            "🗝 Internal Diplomacy",
            "🤲 Mutual Cooperation",
            "🎻 Harmonized Departure",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. You and your colon are on speaking terms.",
            "Top 20% by push smoothness.",
            "Whatever you said to your gut, it listened.",
            "Achievement unlocked: 'Internal Peace Treaty'.",
            "Below global strain average. Diplomacy works.",
          ],
        },
        {
          headline: "Precision Voider",
          sealLabels: [
            "🎯 Calibrated Output",
            "📐 Measured Push",
            "🧪 Lab-Grade Discipline",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Engineered, not improvised.",
            "Top 22% efficiency this week.",
            "You don't poop. You execute.",
            "Achievement: 'Surgical Voider'.",
            "Below global average push duration. Precision pays.",
          ],
        },
        {
          headline: "Honor Roll Output",
          sealLabels: [
            "🏅 Gold Star Bowel",
            "📊 Top-Quartile Performer",
            "🥇 Distinguished Effort",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. The principal called. Good news.",
            "Top 25% of users this week.",
            "Achievement: 'Academic Excellence (Lower GI Division)'.",
            "Your colon got tenure.",
            "Below global average strain. Polished, refined, framed.",
          ],
        },
      ],
      // s15_20 (5) — solid normal-range push
      s15_20: [
        {
          headline: "Statistically Median",
          sealLabels: [
            "📊 Right Down the Middle",
            "🎯 Squarely Average",
            "📈 Bell Curve Royalty",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Perfectly representative.",
            "You are the data. The data is you.",
            "Top 50% — also bottom 50%. Beautifully balanced.",
            "Achievement: 'Demographic Anchor'.",
            "Within global average push range. Reassuringly normal.",
          ],
        },
        {
          headline: "The Working Class Push",
          sealLabels: [
            "🔧 Honest Day's Work",
            "⛏ Shift Completed",
            "📋 Punched the Clock",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. No glamour, just results.",
            "Top 50% efficiency. Backbone of the platform.",
            "Achievement: 'Reliable Workhorse'.",
            "You showed up, you did the thing, you left.",
            "Within healthy push range. Salt of the earth.",
          ],
        },
        {
          headline: "Routine Deployment",
          sealLabels: [
            "📦 Standard Delivery",
            "🚚 On-Schedule Drop",
            "📬 Routine Dispatch",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Nothing surprising. That's the win.",
            "Within median band of all global pushes.",
            "Achievement: 'Logistically Sound'.",
            "You are the Amazon of bowel movements.",
            "Push duration squarely in normal range.",
          ],
        },
        {
          headline: "The Comfortable Push",
          sealLabels: [
            "🛋 Easy Chair Energy",
            "☕ Sunday Morning Pace",
            "🪴 No Stress Detected",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Relaxed. Unhurried. Civilized.",
            "Top 50% of low-stress sessions.",
            "Achievement: 'Tranquil Voider'.",
            "Like watching a documentary, but pooping.",
            "Within global average push duration.",
          ],
        },
        {
          headline: "Mid-Tier Mastery",
          sealLabels: [
            "🥉 Honest Bronze Performance",
            "🎽 Reliable Mid-Pack",
            "📐 Centered Output",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Not flashy. Just functional.",
            "Top 50% of all sessions this week.",
            "Achievement: 'Consistent Contributor'.",
            "Mediocrity is underrated and you are proof.",
            "Within global push range. Steady as she goes.",
          ],
        },
      ],
      // s20_25 (3) — getting into the work zone
      s20_25: [
        {
          headline: "Mild Negotiation",
          sealLabels: [
            "🤝 Peaceful Discussion",
            "💬 Internal Mediation",
            "📜 Polite Persuasion",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Took a moment, but you got there.",
            "Slightly above global push average. No biggie.",
            "Achievement: 'Diplomatic Resolution'.",
            "Your colon raised some concerns. You addressed them.",
            "Top 60% by push diligence.",
          ],
        },
        {
          headline: "The Committed Push",
          sealLabels: [
            "💪 Earnest Effort",
            "🏗 Constructive Strain",
            "🎯 Engaged Output",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. You meant it. The bowel responded.",
            "Slightly above global push average — earned, not strained.",
            "Achievement: 'Productive Contributor'.",
            "Honest work. Fair pay.",
            "Above global average push duration by a hair. Earned the W.",
          ],
        },
        {
          headline: "The Gentle Coercion",
          sealLabels: [
            "🪶 Soft Insistence",
            "📖 By the Book",
            "🌱 Patient Cultivation",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Not forced. Just encouraged.",
            "Top 60% of sessions by patience.",
            "Achievement: 'Bowel Diplomat'.",
            "You did not yell. You merely suggested.",
            "Just above global average push duration. 😭 Worth it.",
          ],
        },
      ],
      // s25_30 (3) — entering the work zone
      s25_30: [
        {
          headline: "Honest Labor",
          sealLabels: [
            "⚒ Roll Up Your Sleeves",
            "🏗 Construction Zone",
            "💼 Earned Every Inch",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. This was a job. You showed up.",
            "Above global average push by ~30%. Hard-earned.",
            "Achievement: 'Blue Collar Bowel'.",
            "No shortcuts. No glamour. Just grit.",
            "Strain efficiency: respectable. Result: undeniable.",
          ],
        },
        {
          headline: "The Long Push",
          sealLabels: [
            "⏳ Endurance Mode",
            "🪓 Manual Labor Edition",
            "🔩 Worked Through It",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. You and the porcelain went the distance.",
            "Above global average push time. 😭 Respect, though.",
            "Achievement: 'Push Through Adversity'.",
            "Your quads will thank you tomorrow.",
            "Slightly elevated strain. Acceptable losses.",
          ],
        },
        {
          headline: "The Determined Push",
          sealLabels: [
            "🎯 Refused to Quit",
            "🥾 Boots on the Ground",
            "🗿 Stoic Voider",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Persistence pays dividends.",
            "Above global push duration average. Earned every second.",
            "Achievement: 'Will of Iron'.",
            "Lesser users would have given up. You are not lesser.",
            "Strain endured. Honor maintained.",
          ],
        },
      ],
      // s30_40 (5) — heavy labor, real strain
      s30_40: [
        {
          headline: "Heavy Industrial Output",
          sealLabels: [
            "🏭 Factory Floor Energy",
            "⛏ Bowel Mining Operation",
            "🚜 Tilled the Earth",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. This was a project, not a poop.",
            "Above global average push time by ~80%. 😭 Brutal but yours.",
            "Achievement: 'Industrial Voider'.",
            "Toilet should file a workman's comp claim.",
            "Strain efficiency: questionable. Determination: unmatched.",
          ],
        },
        {
          headline: "The Filibuster",
          sealLabels: [
            "🏛 Held the Floor",
            "📢 Refused to Yield",
            "🪑 Marathon Session",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. You spoke at length. The bowel listened. Eventually.",
            "Well above global push average. 😭 Painful but committed.",
            "Achievement: 'Endurance Voider'.",
            "Other users tap out at 20s. You're built different.",
            "Top 80th percentile push duration. (You don't want to be in this percentile.)",
          ],
        },
        {
          headline: "Geological Time Push",
          sealLabels: [
            "🪨 Sedimentary Process",
            "🌋 Tectonic Patience",
            "⏳ Glacial Progress",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Measured in epochs.",
            "Far above global push average. 😭 The toilet aged with you.",
            "Achievement: 'Pushed Through the Cretaceous'.",
            "You watched a continent drift while pushing.",
            "Strain efficiency: borderline geological. Output: legendary.",
          ],
        },
        {
          headline: "The Iron Will",
          sealLabels: [
            "⚔ Unyielding Voider",
            "🛡 Refused to Surrender",
            "🗿 Built Different",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Most would have quit. You did not.",
            "Above global push average by a wide margin. 😭",
            "Achievement: 'Refusal to Yield'.",
            "Pain is temporary. The flush is forever.",
            "Strain elevated. Honor immortal.",
          ],
        },
        {
          headline: "Construction Zone Closure",
          sealLabels: [
            "🚧 Lane Was Closed",
            "🦺 Hard Hat Required",
            "📋 Permit-Required Push",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. Detours were in effect.",
            "Above global push average. 😭 Heavy machinery deployed.",
            "Achievement: 'Major Infrastructure Project'.",
            "City council will be notified.",
            "Strain efficiency: under review. Output: substantial.",
          ],
        },
      ],
      // over_40s (2) — extreme push, dire territory
      over_40s: [
        {
          headline: "Code Red — Extended Siege",
          sealLabels: [
            "🚨 Emergency Push Duration",
            "⚠ Bowel Hostage Situation",
            "🆘 Fiber Intervention Required",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. This was not a poop. This was a standoff.",
            "Top 1% longest pushes — not a flex. 😭",
            "Achievement: 'Survived the Siege'.",
            "Your gastroenterologist would like to schedule a chat.",
            "Strain efficiency: catastrophic. Bravery: undeniable. Maybe drink some water.",
          ],
        },
        {
          headline: "The Hostage Negotiation",
          sealLabels: [
            "🕊 Eventually Released",
            "📞 Crisis Hotline Activated",
            "🧗 Extracted at Great Cost",
          ],
          sublines: [
            "Your longest push: {longestPushSec}s. The bowel held it captive. You won.",
            "Far above the 99th percentile of push durations. 😭",
            "Achievement: 'Survived Against All Odds'.",
            "Consider this a sign from the universe to add more fiber.",
            "Strain efficiency: a tragedy. Persistence: heroic. Hydration: please.",
          ],
        },
      ],
    },
    session_timer: {
      // under_10s (2) — sub-10-second sessions: rare/absurd
      under_10s: [
        {
          headline: "The Phantom Flush",
          sealLabels: [
            "⚡ Cryptid-Level Speed",
            "👻 Ghost Output Detected",
            "🚀 Sub-Orbital Velocity",
          ],
          sublines: [
            "Blinked and it was over. Science cannot explain this.",
            "{durationSec} seconds. The toilet barely had time to register.",
            "Top 0.1% fastest sessions ever recorded on this app.",
            "If you sneezed, you missed it.",
            "Below global average sit-time by approximately 99%. 😭 (in a good way)",
          ],
        },
        {
          headline: "Touched the Seat & Left",
          sealLabels: [
            "💨 Drive-By Defecation",
            "⏱️ Pit-Stop Performance",
            "🏃 Cheetah Class Output",
          ],
          sublines: [
            "Did you even sit down? The data says barely.",
            "{durationSec} seconds is a coffee order, not a poop session.",
            "Rare event: the body chose violence and won.",
            "Faster than 99% of today's poopers. By a mile.",
            "We're calling the world record people. Just in case.",
          ],
        },
      ],

      // s10_30 (2) — 10–30s: still very fast
      s10_30: [
        {
          headline: "The Express Lane",
          sealLabels: [
            "🚄 Bullet-Train Bowels",
            "📦 Same-Day Delivery",
            "⚡ Premium Throughput",
          ],
          sublines: [
            "{durationSec} seconds, in and out. Industrial efficiency.",
            "The body had no questions. The bowels had no notes.",
            "Top 5% fastest sessions today. The toilet barely warmed up.",
            "Below global average sit-time. Way below. 😭 (a compliment)",
            "Faster than your last microwave meal.",
          ],
        },
        {
          headline: "Quick Drop, Clean Exit",
          sealLabels: [
            "🥇 Speed Demon Tier",
            "🎯 Surgical Precision",
            "⏱️ Stopwatch-Tier Operator",
          ],
          sublines: [
            "{durationSec} seconds of focused output. No wasted motion.",
            "This is what efficiency looks like. Take notes.",
            "The body was prepped. The body executed. Adjourned.",
            "You spent more time washing your hands than pooping.",
            "Achievement unlocked: Sub-30-Second Session.",
          ],
        },
      ],

      // s30_to_1min (1) — 30s–1min: snappy
      s30_to_1min: [
        {
          headline: "Brisk and Businesslike",
          sealLabels: [
            "💼 Executive Output",
            "🧾 Receipt-Length Session",
            "⏰ Punctual Departure",
          ],
          sublines: [
            "{durationSec} seconds. Professional. Dignified. Done.",
            "No drama. No suspense. Just results.",
            "Top 15% fastest sessions today. Crisp work.",
            "The toilet didn't even need a chance to think about it.",
            "Faster than reading the back of a cereal box.",
          ],
        },
      ],

      // m1_5 (1) — 1–5min: normal range
      m1_5: [
        {
          headline: "Statistically Median",
          sealLabels: [
            "📊 Benchmark Human",
            "📋 Clinically Unremarkable",
            "🎯 Right On The Bell Curve",
          ],
          sublines: [
            "Right in the middle of the bell curve. You are the data.",
            "A perfectly normal poop happened. The historians are bored.",
            "{durationMin} minute(s) — the global average. Welcome, average human.",
            "Nothing rare. Nothing tragic. Just a poop, well-executed.",
            "You and 47% of today's poopers. Beautifully unremarkable.",
          ],
        },
      ],

      // m7_12 (2) — 7–12min: long but not extreme
      m7_12: [
        {
          headline: "The Scroll Session",
          sealLabels: [
            "📱 Doom-Scroll Confirmed",
            "🪑 Seat Marathon Tier",
            "💭 Productive-Adjacent",
          ],
          sublines: [
            "{durationMin} minutes. Be honest — you were on your phone.",
            "The poop ended {durationSec} seconds in. The sitting continued.",
            "You spent more time in there than the actual job required.",
            "Below global effort average — most of this was vibes. 😭",
            "Time well spent. Allegedly.",
          ],
        },
        {
          headline: "The Long Sit",
          sealLabels: [
            "🕰️ Extended Stay Authorized",
            "🏝️ Bathroom Vacation",
            "🛋️ Domicile Status: Toilet",
          ],
          sublines: [
            "{durationMin} minutes. At what point does this become a hobby?",
            "You committed. The toilet committed. Both parties stayed the course.",
            "The sit outlasted the actual need. Bold strategy.",
            "Top 20% longest sessions today. Achievement of dubious honor.",
            "This was a lifestyle choice, not a bathroom visit.",
          ],
        },
      ],

      // over_12m (1) — extreme
      over_12m: [
        {
          headline: "Took Up Residence",
          sealLabels: [
            "🏚️ Permanent Address: Toilet",
            "📜 Bathroom Tenancy Granted",
            "⚠️ Concerning Duration Flag",
          ],
          sublines: [
            "{durationMin} minutes. Your legs are asleep. We can hear them screaming.",
            "At some point this stopped being a bathroom visit and became a lifestyle.",
            "Top 1% longest sessions on the app. Dubious distinction.",
            "Whatever you were watching, it wasn't worth the circulation loss.",
            "Critical failure of the timer. Or your bowels. Possibly both.",
          ],
        },
      ],
    },
    started_time: {
      // h2_4 (1) — deep-night anomaly
      h2_4: [
        {
          headline: "The 3AM Defector",
          sealLabels: [
            "🌑 Confirmed Nocturnal Specimen",
            "👁️ Witnessed By Nobody",
            "🦉 Off-Hours Operator",
          ],
          sublines: [
            "Most humans are unconscious right now. You are pushing.",
            "Your circadian rhythm filed a formal complaint.",
            "Logged in the witching hour. The bowels do not sleep.",
            "Statistically, 0.4% of poops happen in this window. You're a data point.",
            "This timestamp will haunt the leaderboard.",
          ],
        },
      ],

      // h4_6 (1) — early bird
      h4_6: [
        {
          headline: "Early Bird Catches the Worm",
          sealLabels: [
            "🐛 Worm Successfully Caught",
            "🌅 Pre-Dawn Productivity",
            "☕ Beat the Coffee",
          ],
          sublines: [
            "The sun isn't even up. You're already winning.",
            "Most people set alarms. You set bowel movements.",
            "Pre-dawn elimination. Top 3% of morning achievers.",
            "Beat the rooster. Beat the gym people. Beat the news cycle.",
            "Rare timestamp window — fewer than 2% of sessions log here.",
          ],
        },
      ],

      // h6_8 (2) — morning
      h6_8: [
        {
          headline: "The Textbook Morning",
          sealLabels: [
            "📖 Clinically Punctual",
            "⏰ On-Schedule Output",
            "🥣 Pre-Breakfast Achievement",
          ],
          sublines: [
            "Right on the bell curve. The body is working as designed.",
            "Morning poop achieved. Day may proceed.",
            "You hit the global average start time. Beautifully unremarkable.",
            "The most popular hour. You are one of millions, in the best way.",
            "Coffee hasn't even kicked in. Impressive initiative.",
          ],
        },
        {
          headline: "Up With the Caffeine",
          sealLabels: [
            "☕ Stimulant-Synced Bowel",
            "🥐 Continental Breakfast Compliant",
            "📰 Newspaper-Adjacent Operator",
          ],
          sublines: [
            "Rolled out of bed and straight into productivity. Respect.",
            "The morning poop is the only meeting that matters.",
            "Statistically the healthiest window. Doctors would approve.",
            "Below global average effort, but the timing carries you. 😭",
            "You and 11 million other humans, simultaneously. Solidarity.",
          ],
        },
      ],

      // h12_14 (1) — lunch
      h12_14: [
        {
          headline: "The Lunchtime Reset",
          sealLabels: [
            "🥪 Mid-Day Maintenance",
            "🏢 Office Bathroom Veteran",
            "⏸️ Workday Intermission",
          ],
          sublines: [
            "Right between meals. The body knows.",
            "You took your lunch break literally. The bowels approve.",
            "Mid-day session — 38% of workplace poops happen now.",
            "Charging for this on the timesheet? Bold.",
            "The afternoon will be productive. This was necessary.",
          ],
        },
      ],

      // h22_24 (1) — late night
      h22_24: [
        {
          headline: "The Pre-Bed Clearance",
          sealLabels: [
            "🛏️ Sleep-Adjacent Operator",
            "🌙 End-of-Day Filed",
            "🦷 Post-Brush Production",
          ],
          sublines: [
            "Closing out the day with one last administrative task.",
            "You'll sleep better. The body knows what it's doing.",
            "Late-night logger. The day refuses to end without resolution.",
            "Could've waited until morning. Chose violence instead.",
            "11 PM crowd. Quiet, dignified, slightly tired bowels.",
          ],
        },
      ],

      // h0_2 (1) — after midnight
      h0_2: [
        {
          headline: "The Post-Midnight Filing",
          sealLabels: [
            "🕛 After-Hours Submission",
            "🌚 Tomorrow's Problem, Today",
            "📅 Next-Day Backdated",
          ],
          sublines: [
            "Technically tomorrow. Technically still today. The bowels don't care.",
            "You should be asleep. The body had other plans.",
            "Post-midnight session. The night owls salute you.",
            "Couldn't even wait until 6 AM like a normal person. 😭",
            "Logged before most people finished dinner in Tokyo.",
          ],
        },
      ],
    },
    expulsion_count: {
      // one (3) — clean single drop
      one: [
        {
          headline: "The Solo Artist",
          sealLabels: [
            "1️⃣ Single Drop Confirmed",
            "🎯 One-Shot Wonder",
            "✨ Decisive Output",
          ],
          sublines: [
            "{pushCount} expulsion. Surgical, complete, conclusive.",
            "Achievement unlocked: 'One and Done'.",
            "Top 30% of users go single-shot. Welcome to the club.",
            "No follow-ups required. Crisp.",
            "Below global average expulsion count. Efficient as hell.",
          ],
        },
        {
          headline: "Clean Break",
          sealLabels: [
            "✂ Severed in One Cut",
            "🪨 Monolith Output",
            "🎬 Perfect Take One",
          ],
          sublines: [
            "{pushCount} cut. No retakes needed.",
            "Achievement: 'Director's Cut'.",
            "Below global average expulsions. Editing was a breeze.",
            "Single, complete, well-formed. Bristol would weep.",
            "You did not negotiate. You delivered.",
          ],
        },
        {
          headline: "The Decisive Strike",
          sealLabels: [
            "⚔ Single Killing Blow",
            "🎯 Bullseye on First Try",
            "🏹 No Second Arrow Needed",
          ],
          sublines: [
            "{pushCount} expulsion. Final answer.",
            "Top 25% by output decisiveness.",
            "Achievement: 'Lethal Efficiency'.",
            "Most users hedge their bets. You did not.",
            "Below global average cut count. Clean execution.",
          ],
        },
      ],
      // two (3) — the comfortable double
      two: [
        {
          headline: "The Comfortable Double",
          sealLabels: [
            "2️⃣ Tasteful Pair",
            "👯 Matched Set",
            "🎼 Two-Part Harmony",
          ],
          sublines: [
            "{pushCount} expulsions. Balanced. Considered. Civilized.",
            "Below global average cut count. Pleasant.",
            "Achievement: 'The Tasteful Pair'.",
            "Two is the sweet spot. You found it.",
            "Top 35% by output composure.",
          ],
        },
        {
          headline: "Side A and Side B",
          sealLabels: [
            "💿 The Full Album",
            "📖 Two-Chapter Saga",
            "🎬 Sequel Acceptable",
          ],
          sublines: [
            "{pushCount} expulsions. Both tracks bangers.",
            "Below global average expulsion count. Wholesome listening.",
            "Achievement: 'The Encore'.",
            "Tasteful sequel. No need for a trilogy.",
            "Two-part output. Grammy worthy.",
          ],
        },
        {
          headline: "The Polite Encore",
          sealLabels: [
            "👏 Brief Applause Demanded",
            "🎤 Returned to the Mic",
            "🎭 Two-Bow Performance",
          ],
          sublines: [
            "{pushCount} expulsions. The crowd asked nicely. You obliged.",
            "Achievement: 'Crowd Pleaser'.",
            "Below global average cuts. Tasteful response to demand.",
            "You don't overstay. You return precisely once.",
            "Top 40% of expulsion etiquette.",
          ],
        },
      ],
      // three (3) — the classic trio
      three: [
        {
          headline: "The Classic Trio",
          sealLabels: [
            "3️⃣ Hat Trick Achieved",
            "🥇 Triple Threat",
            "🎯 Triangulated Output",
          ],
          sublines: [
            "{pushCount} expulsions. Beginning, middle, satisfying end.",
            "Within global average expulsion range. Reliable.",
            "Achievement: 'The Hat Trick'.",
            "Three is the magic number. You found it.",
            "Top 50% of structurally sound sessions.",
          ],
        },
        {
          headline: "The Three-Act Structure",
          sealLabels: [
            "🎭 Setup, Confrontation, Resolution",
            "📚 Aristotelian Bowel",
            "🎬 Dramatic Pacing",
          ],
          sublines: [
            "{pushCount} expulsions. Properly paced. No filler.",
            "Within global average cut count.",
            "Achievement: 'Narrative Coherence'.",
            "Your colon studied screenwriting.",
            "A complete story arc. Critic approved.",
          ],
        },
        {
          headline: "Triple Feature",
          sealLabels: [
            "🎬 Marathon Matinee",
            "🍿 Three Course Meal",
            "🎢 Trilogy Completed",
          ],
          sublines: [
            "{pushCount} expulsions. Each one earned its runtime.",
            "Within global average expulsion count.",
            "Achievement: 'The Trilogy Closer'.",
            "All three movies were good. Even the third one.",
            "Top 50% by output completeness.",
          ],
        },
      ],
      // four (3) — getting talkative
      four: [
        {
          headline: "The Verbose Output",
          sealLabels: [
            "4️⃣ Quad Drop Confirmed",
            "📝 Long-Form Submission",
            "🎬 Director's Cut Edition",
          ],
          sublines: [
            "{pushCount} expulsions. You had a lot to say.",
            "Slightly above global average expulsion count.",
            "Achievement: 'Comprehensive Coverage'.",
            "Four is fine. Four is generous. Four is you.",
            "Top 60% by output thoroughness.",
          ],
        },
        {
          headline: "The Multi-Course Meal",
          sealLabels: [
            "🍽 Four Plates Cleared",
            "🎼 Four-Movement Symphony",
            "📚 Four-Volume Set",
          ],
          sublines: [
            "{pushCount} expulsions. A proper sit-down dinner.",
            "Slightly above global cut average. Generous portions.",
            "Achievement: 'Four-Course Voider'.",
            "Soup, salad, entree, dessert. All accounted for.",
            "Top 60% of comprehensive sessions.",
          ],
        },
        {
          headline: "Quartet Performance",
          sealLabels: [
            "🎻 String Quartet Energy",
            "🎼 Four-Part Harmony",
            "🎵 Complete Ensemble",
          ],
          sublines: [
            "{pushCount} expulsions. Each one held its own note.",
            "Above global average expulsion count by ~30%.",
            "Achievement: 'Chamber Music Voider'.",
            "Beethoven would approve. Probably.",
            "Top 60% by output complexity.",
          ],
        },
      ],
      // five (3) — fully committed session
      five: [
        {
          headline: "The Full Quintet",
          sealLabels: [
            "5️⃣ Five-Star Output",
            "🖐 Full Hand Committed",
            "🎼 Pentatonic Symphony",
          ],
          sublines: [
            "{pushCount} expulsions. You came to play.",
            "Above global average cut count by ~50%. 😭 Generous.",
            "Achievement: 'High Committed Voider'.",
            "Five is a commitment. You are not afraid of commitment.",
            "Top 75% by expulsion enthusiasm.",
          ],
        },
        {
          headline: "Five-Course Tasting Menu",
          sealLabels: [
            "🍽 Chef's Selection",
            "🥂 Wine Pairing Available",
            "📜 Multi-Plate Saga",
          ],
          sublines: [
            "{pushCount} expulsions. Each course thoughtfully prepared.",
            "Above global average expulsion count. 😭 Worth it though.",
            "Achievement: 'Tasting Menu Voider'.",
            "Michelin guide is taking notes.",
            "Top 75% of comprehensive output.",
          ],
        },
        {
          headline: "The Open Mic Night",
          sealLabels: [
            "🎤 Five Sets Delivered",
            "🎭 Refused to Leave Stage",
            "📢 Loved the Spotlight",
          ],
          sublines: [
            "{pushCount} expulsions. The crowd... was there.",
            "Above global average expulsion count. 😭",
            "Achievement: 'Held the Mic'.",
            "You had more to say. You said all of it.",
            "Top 75% by output verbosity.",
          ],
        },
      ],
      // over_5 (2) — chaotic, generous, alarming
      over_5: [
        {
          headline: "The Multi-Cut Meltdown",
          sealLabels: [
            "🚨 Six-Plus Confirmed",
            "🌊 Tidal Wave Output",
            "💥 Output Cascade Event",
          ],
          sublines: [
            "{pushCount} expulsions. The fragmentation was severe.",
            "Top 5% highest expulsion count. 😭 (not a flex)",
            "Achievement: 'Total Output Cascade'.",
            "Bristol stool chart is filing a noise complaint.",
            "Way above global average cut count. Hydrate. Maybe see someone.",
          ],
        },
        {
          headline: "The Endless Saga",
          sealLabels: [
            "📜 Multi-Volume Epic",
            "🌪 Continuous Discharge",
            "⏳ Showed No Signs of Stopping",
          ],
          sublines: [
            "{pushCount} expulsions. The story refused to end.",
            "Top 3% by raw expulsion volume. 😭",
            "Achievement: 'War and Peace Voider'.",
            "If your output were a Netflix series, it would be cancelled for being too long.",
            "Far above global average. Consider some fiber and a hug.",
          ],
        },
      ],
    },
    estimated_velocity: {
      // low (<1) — slow, lethargic output
      low: [
        {
          headline: "The Slow Drift",
          sealLabels: [
            "🐢 Languid Velocity",
            "🪶 Featherweight Output",
            "💤 Low-Energy Egress",
          ],
          sublines: [
            "Velocity coefficient: barely registered. Output drifted out at its leisure.",
            "{pushCount} expulsion(s) over {durationMin} minutes. Unhurried.",
            "Achievement: 'The Glacial Voider'.",
            "Below global average velocity. Zen-like, or possibly napping.",
            "Output had places to be, none of them urgent.",
          ],
        },
      ],
      // high (>=5) — explosive, alarming velocity
      high: [
        {
          headline: "Ballistic Trajectory",
          sealLabels: [
            "🚀 High-Velocity Output",
            "💥 Explosive Egress",
            "⚡ Top-Percentile Discharge",
          ],
          sublines: [
            "Velocity coefficient: dangerously elevated. Toilet bowl reports turbulence.",
            "{pushCount} expulsion(s) compressed into {durationMin} minutes of pure motion.",
            "Achievement: 'Top 1% Velocity Tier'.",
            "Above global average velocity by a wide margin. Hold on tight. 😭",
            "If pooping had a Mach number, you broke it.",
          ],
        },
      ],
    },
    strain_efficiency: {
      // under_15 (1) — barely worked for it
      under_15: [
        {
          headline: "Effortless Egress Champion",
          sealLabels: [
            "🪶 Sub-15% Strain Used",
            "🧈 Buttery Compliance Detected",
            "🛝 Frictionless Pioneer",
          ],
          sublines: [
            "Strain efficiency under 15%. The bowel barely participated and yet — output.",
            "Top 5% lowest-strain sessions. You barely tried.",
            "Achievement: 'Effortless Voider'.",
            "Below global average strain by ~85%. Disgustingly graceful. 😭",
            "This is what they mean by 'feed the system fiber'.",
          ],
        },
      ],
      // p15_30 (1) — easy, healthy push
      p15_30: [
        {
          headline: "The Easy Win",
          sealLabels: [
            "📊 Healthy 15-30% Range",
            "✅ Clinically Optimal",
            "🎓 Honors Strain Discipline",
          ],
          sublines: [
            "Strain efficiency 15-30%. The textbook range. Gastroenterologists rejoice.",
            "Top 25% by strain composure.",
            "Achievement: 'Optimal Voider'.",
            "Below global average strain. Healthy, balanced, framed.",
            "This is what 'eat your vegetables' looks like in practice.",
          ],
        },
      ],
      // p90_100 (1) — pushing the limits, dire
      p90_100: [
        {
          headline: "Strain Limit Approached",
          sealLabels: [
            "🚨 90%+ Strain Engaged",
            "⚠ Capacity Nearly Exceeded",
            "🆘 Maximum Effort Logged",
          ],
          sublines: [
            "Strain efficiency 90-100%. The bowel called HR. You ignored it.",
            "Top 1% strain category. 😭 Not a leaderboard you want.",
            "Achievement: 'Pushed to the Brink'.",
            "Far above global average strain. Hydrate. Maybe stretch. Maybe panic a little.",
            "You looked the abyss in the eye. The abyss looked back. Then it pooped.",
          ],
        },
      ],
    },
    structural_integrity: {
      // nominal (1) — perfect single solid log
      nominal: [
        {
          headline: "Monolithic Output Confirmed",
          sealLabels: [
            "🪨 Structural Integrity: NOMINAL",
            "🏛 Single-Cast Excellence",
            "🎯 Bristol Type 4 Energy",
          ],
          sublines: [
            "One push, one cut, perfect cohesion. Engineers wept.",
            "Top 10% structural integrity. Bristol scale royalty.",
            "Achievement: 'Monolith of the Realm'.",
            "Below global average fragmentation. Built like a cathedral.",
            "This output could be displayed in a museum. (It will not be. But it could.)",
          ],
        },
      ],
      // critical (1) — fully fragmented disaster
      critical: [
        {
          headline: "Critical Structural Failure",
          sealLabels: [
            "🚨 Structural Integrity: CRITICAL",
            "💥 Fragmentation Cascade",
            "🆘 Cohesion Lost",
          ],
          sublines: [
            "Multi-cut chaos. Continuity destroyed. The bowl looks like a Pollock painting.",
            "Top 3% structural breakdown. 😭 Not a flex.",
            "Achievement: 'Total Cohesion Failure'.",
            "Far above global average fragmentation. Consider some fiber. And maybe a hug.",
            "What happened in there should not have happened. And yet, here we are.",
          ],
        },
      ],
    },

    fallback: [
      {
        headline: "Session Complete",
        sealLabels: [
          "✅ Provisional Bathroom Authority",
          "📝 Logged & Filed",
          "🚽 Civic Duty Fulfilled",
        ],
        sublines: [
          "A bathroom visit occurred. The record reflects this.",
          "Nothing remarkable. Nothing tragic. A poop happened.",
          "Statistically, this is the most normal thing you'll do today.",
          "The toilet did its job. You did yours. We're all winners.",
          "Logged for posterity. The historians will be unimpressed.",
        ],
      },
    ],
  },
} as const;
