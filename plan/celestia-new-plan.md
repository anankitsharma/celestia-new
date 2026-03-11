✦  ☽  ✦
WESTERN ASTROLOGY APP
THE AMERICAN GIRL BLUEPRINT
Built for the Texas & California girl  ·  Western Astrology Only  ·  iOS-First  ·  USD Pricing
She checks Co-Star before she checks her texts.
She posts her Big 3 in her Instagram bio.
She blames Mercury retrograde when things fall apart.
She is your entire market.
Swiss Ephemeris  ·  Claude AI  ·  Viral Retention  ·  Full US Market Strategy
March 2026  ·  Confidential

👩  WHO SHE IS — YOUR TARGET USER, FULLY MAPPED
 
Before a single line of code is written, you need to know this woman completely — her morning routine, her language, her relationship with astrology, what makes her screenshot something, what makes her pay. Everything below is grounded in real US market data.
 
The Core User Persona
Dimension
Gen Z She  (18–24)
Millennial She  (25–35)
Where she lives
Austin TX, LA, San Diego, Dallas, San Francisco, Phoenix, Denver
Houston, LA, Bay Area, Portland, Seattle, NYC (transplant), Nashville
Daily apps
TikTok, Instagram, Spotify, BeReal, Snapchat, Pinterest
Instagram, Spotify, Reddit, Pinterest, LinkedIn, Apple Podcasts
Astrology entry point
TikTok astrology creator → co-worker asks 'what's your Big 3?' → downloads Co-Star
Susan Miller Astrology Zone for years → discovers AI-powered apps → upgrades
How she uses astrology
Identity + social currency. 'I'm such a Scorpio.' 'That's so Virgo of you.' Posts Big 3 in bio.
Self-growth toolkit. Reads her full birth chart. Tracks transits. Journals alongside readings.
What she pays for
Cute things, aesthetic apps, Spotify Premium, digital stickers. Resists subscriptions.
$12/mo Headspace, $15/mo Spotify, $18/mo Netflix. Comfortable with wellness subscriptions.
Price sweet spot
$3.99–5.99/mo. Must feel like 'less than a latte.'
$7.99–12.99/mo. Will pay for depth and credibility.
How she discovers apps
TikTok 'what app is this?' comments. Friend posts her Share Card to Stories.
Friend recommendation, Reddit r/astrology thread, Google 'birth chart reading app.'
Her pain with current apps
Co-Star is too mean/vague. Feels disconnected from her daily life. Not pretty enough.
Generic sun-sign horoscopes everywhere. Nothing actually uses her FULL chart. Wants depth.
What makes her screenshot
A reading that feels eerily personal. Aesthetic cosmic card. A 3-word vibe that nails her day.
A report that explains her relationship patterns in a way no therapist has.
Her astrology language
'My Mercury is in retrograde so I can't text back.' 'He's a Gemini, obviously.' 'Chaotic Sagittarius energy.'
'Saturn is transiting my 7th house — that explains everything about this relationship.' Understands houses, aspects, transits.
 
The Numbers Behind Her
📊  Real US Market Data — The American Astrology Girl
✦  43% of American women aged 18–49 say they believe in astrology (Pew Research) — your addressable market is enormous
✦  25% of ALL US women aged 18–25 have downloaded Co-Star — 1 in 4 of your exact user is already in the habit
✦  Co-Star has 30 million registered users in the US, growing 100% word-of-mouth with zero marketing spend — proof this audience self-organizes
✦  37% of American women believe in astrology vs. 20% of American men — this is a female-dominated product category
✦  35% of US astrology app users subscribe to premium — significantly higher than global average, because American women spend on wellness
✦  North America holds 34% of global astrology app revenue despite being a fraction of global population — US monetizes best
✦  80% of Gen Z and younger Millennials in the US believe in astrology or find it interesting (YouGov) — cultural saturation point reached
✦  The US astrology app market is on track to triple from $3B to $9B by 2030 — you are entering at the steepest growth curve
✦  Top astrology apps generate $400K+ per month in US revenue — the money is real and concentrated in this demographic
✦  Astrology has become the #1 self-care and self-knowledge tool for American women under 35, surpassing Myers-Briggs and Enneagram in cultural relevance

 
What Western Astrology Means to Her (vs Vedic)
Aspect
Western Astrology (Your App)
Vedic Astrology (NOT your app)
Zodiac system
Tropical zodiac — Sun signs aligned to seasons. Aries season = March 21 (spring equinox). The system she knows.
Sidereal zodiac — aligned to fixed stars. 'You're actually a Pisces, not Aries.' Confuses and alienates Western users.
Sign she knows herself as
Her Co-Star sign. Her Instagram bio sign. The sign her mom told her she was at age 7. NEVER change this.
Could shift her sign by 1, giving her an identity crisis and making her delete the app.
Chart system
Placidus or Whole Sign houses — both are Western. She's used to hearing 'Venus in your 7th house of relationships.'
Vedic uses different house calculations, different planet rulerships, different meanings. Totally foreign to her.
Cultural touchpoints
Susan Miller, Co-Star, The Pattern, Chani Nicholas, ELLE horoscopes, Cosmopolitan, TikTok astrology creators.
AstroTalk, Kundali, Bejan Daruwalla. Names she has never heard of and content not for her.
Planet names/symbols
Sun ☀️ Moon 🌙 Mercury ☿ Venus ♀ Mars ♂ Jupiter ♃ Saturn ♄ Uranus ♅ Neptune ♆ Pluto ♇ — she knows these.
May include Rahu/Ketu (lunar nodes treated as planets), different significance system.
Her emotional relationship
Personal identity, pop culture, therapy supplement, TikTok content, relationship tool. HERS.
Foreign practice. Feels cultural appropriation of a system not her own. Creates distance.
→  Every single calculation, every screen label, every interpretation, every push notification must use Western/Tropical astrology exclusively. No Vedic references anywhere in the product.
 
 

🌐  THE CORE PIPELINE — SWISS EPHEMERIS → AI INTERPRETATIONS
 
This is the engine under the hood. The user never sees it, but it determines whether your app feels like a real astrology tool or another generic horoscope generator. Here's every technical step from birth data entry to the reading she reads at 8am.
 
The 7-Stage Data Flow
Stage
What Happens
Technology
What She Experiences
① Input
She types her birth date, time, and city. App autocompletes the city and resolves lat/lng + US time zone (ET/CT/MT/PT) automatically.
Google Places API (city autocomplete) + Google Time Zone API
She types 'Austin' and it auto-fills 'Austin, TX, USA' with the Texas flag. Feels smart. 'I don't know my time' option is prominent — doesn't block progress.
② UTC Convert
Birth time is converted from local US time zone (including daylight saving at that date) to exact Universal Time. Critical for accuracy.
TimezoneDB API or Google Time Zone API + DST offset table
Invisible to her. But this is the step that separates apps that are accurate from ones that are slightly off.
③ Ephemeris
Swiss Ephemeris calculates: exact degree of all 10 planets + Ascendant + Midheaven at the precise UTC birth moment. Returns retrograde status and house positions.
pyswisseph Python library (NASA JPL DE431 dataset)
The 3-second loading animation. 'Reading the stars at your exact birth moment...' Then the big reveal.
④ Structure
Raw ephemeris output organized into a full chart JSON: every planet's sign, house, degree, retrograde Y/N, and aspects to every other planet. Stored permanently.
FastAPI backend → PostgreSQL (JSONB column)
Invisible — but this is her astrological fingerprint that every reading references forever.
⑤ AI Interpret
Chart JSON sent to Claude API with a professional western astrologer system prompt. Returns 300–500 words of personal prose per major placement. Cached by placement combo.
Anthropic claude-sonnet-4-6
Reads like a thoughtful human astrologer who knows her well. Not 'Scorpios are intense.' More like: 'With your Sun in Scorpio in the 4th house, your deepest power lives at home and in your emotional roots.'
⑥ Daily Transit
Every night at midnight: today's planetary sky calculated. Compared to her natal chart. Meaningful aspects found. Claude generates her unique 150-word daily reading. Pre-loaded before she wakes up.
Cron job + Redis cache (24h TTL)
She opens the app at 7:52am. Her reading is already there. Instant. Personal. References a real planetary event happening today.
⑦ Loop
Streak tracked, journal logged, friend charts updated, share card ready. Every action deepens her investment in the app.
Redis + PostgreSQL + FCM push
The app gets MORE personal over time. Hard to imagine switching and losing everything she's built.
 
Swiss Ephemeris — Why It's Non-Negotiable
⚙️  Swiss Ephemeris: The Only Acceptable Engine for a Credible Western Astrology App
✦  WHAT IT IS: An astronomical calculation library based on NASA's JPL DE431 dataset. Accurate to 0.001 arc-seconds. The same engine used by Co-Star, Sanctuary, TimePassages, and every professional astrology software.
✦  TROPICAL/WESTERN ONLY SETTING: When calling swe.calc_ut(), pass the SEFLG_SWIEPH flag without sidereal settings. This gives you tropical zodiac positions that match what your users expect from their birth sign.
✦  10 PLANETS CALCULATED: Sun (0), Moon (1), Mercury (2), Venus (3), Mars (4), Jupiter (5), Saturn (6), Uranus (7), Neptune (8), Pluto (9) — the complete Western astrology planet set.
✦  HOUSE SYSTEMS: Use Placidus ('P' flag) as default — it's what Co-Star, Sanctuary, and most Western apps use. Option to switch to Whole Sign ('W') for users who prefer it. Both are purely Western.
✦  ASCENDANT + MIDHEAVEN: swe.houses() returns all 12 house cusps, ASC, and MC — essential for 'Rising sign' which is her most-shared identity marker after Sun sign.
✦  RETROGRADE DETECTION: If the speed value from calc_ut() is negative → planet is retrograde. This powers your 'Mercury Retrograde' event alerts — her favorite feature.
✦  ASPECTS: Calculate angular distance between every planet pair. Standard Western orbs: Conjunction ±8°, Opposition ±8°, Trine ±6°, Square ±6°, Sextile ±4°.
✦  LICENSE: ~$800 one-time Professional License for commercial use. Absolute bargain — this is the entire foundation of your product.

 
Claude AI — Interpreting the Chart in Her Language
Use Case
Prompt Strategy
Sample Output Tone
Cost
Natal placement
System: 'You are an experienced western astrologer writing for modern American women. Be personal, psychological, conversational — not mystical or generic. No clichés like "naturally intuitive" or "fiercely loyal."' User: 'Write 350 words for Sun in Scorpio in the 4th house. Other placements: Moon Pisces, Rising Capricorn.'
'Your Sun in Scorpio in the 4th house means your identity is forged in privacy. You don't perform your power — you guard it. Home is both your safe haven and your most complicated relationship...'
~$0.003. Cache by placement combo — reuse for every user who shares that placement.
Daily transit
'Write a 150-word personal daily reading for [Name], a [Sun Sign] with [Moon Sign] Moon and [Rising] Rising. Today: Venus is sextile her natal Mars. Mercury is conjunct her natal Sun. Write in a warm, direct American voice. No mystical jargon.'
'Today has your name on it, [Name]. Mercury sitting exactly on your Sun is like the universe handing you a megaphone — say what you mean, send that email, start that conversation...'
~$0.001. Pre-generate for all users at midnight. Cache in Redis.
Ask the Stars
'You are her personal western astrologer. Her full chart JSON: {chart}. She asks: {question}. Answer in 200 words. Be direct and specific to her placements — not generic.'
Premium only. She types 'Is this guy right for me?' and gets a response grounded in her actual Venus placement and the guy's sun sign.
~$0.003. Premium feature. Not cached — every question unique.
Full report text
Sequential calls per report section. Each includes full chart JSON + section prompt. A 30-page report = 8–12 Claude calls total.
Reads like a professional astrologer wrote her a personalized book about herself. Not a word from any other user's report.
~$0.025–0.06/report. User pays $5–9. High margin.
Free tier copy (no AI)
Rule-based text library: 144 sun-sign × house combinations. Decent quality, consistent. No API cost.
Good but not personal. The difference between free and premium is immediately obvious — drives upgrades.
$0. Free users get this. Makes the AI version feel magic in comparison.
 
 

🧠  PSYCHOLOGY & RETENTION — DESIGNED FOR HER BRAIN
 
Every design and feature decision must be grounded in how this specific woman thinks and feels. The apps she's most addicted to — Duolingo, TikTok, Spotify, BeReal — all pull the same psychological levers. Here's how to pull them for her.
 
The Hook Model — Applied to Her Daily Life
Phase
What It Is
How Your App Uses It
Her Internal Experience
TRIGGER
The cue that causes her to open the app. Can be external (notification) or internal (emotion).
External: '🌙 Venus moves into your 5th house today — romance is activated' arrives at 7:45am. Internal: she wakes up anxious, uncertain about a decision — app is her first check, like weather.
'I need to see what the stars say before I start my day.'
ACTION
The simplest possible behavior leading to reward. Must be near-zero friction.
She taps the notification. App opens directly to her personalized reading — already pre-loaded. One tap. Full value immediately.
'That was so easy. It just opened.'
VARIABLE REWARD
The reward must be unpredictable. Randomness fires dopamine 2x harder than certainty. This is why slot machines are addictive.
Every day's reading is different in content and emotional weight. Some days it's deeply affirming. Some days it's a challenge. Once a month, a rare event (Venus-Sun conjunction on her Rising) creates a special full-screen moment she's never seen before.
'I never know what I'm going to get. That's why I always check.'
INVESTMENT
The more she puts in, the more she values it and the harder it is to leave.
Her natal chart data, saved family charts, a 60-day streak, journal entries, downloaded reports, friends' compat scores — all stored in the app. Switching apps means rebuilding her entire cosmic identity from scratch.
'This app knows me better than anything else. I'm never leaving.'
 
10 Retention Mechanics — Built for Her
Feature
Psychological Principle
Exact Implementation
Copy She Sees
Cosmic Streak 🔥
Loss Aversion (Kahneman): losing something hurts 2× more than gaining. Duolingo's #1 driver — 80% of its DAU are streak-motivated.
Daily check-in adds to her streak. Flame counter on home screen. Miss a day → 9pm push: 'Your streak ends in 3 hours, babe 🔥'. Premium users get 1 free streak freeze/month. Milestone badges: 7 days ✨, 30 days 🌙, 90 days ⭐, 365 days 👑.
'my 47-day streak 🔥' — she will mention this unprompted.
The Big 3 Identity Card
Self-Concept Clarity: she returns to apps that reflect who she is. Her Big 3 IS her identity shorthand in American girl culture.
Generated at end of onboarding. 6 card styles: Dark Cosmic, Rose Gold, Celestial Blue, Earthy Sage, Midnight Glam, Pastel Dream. She picks her fave. One tap to Instagram Stories. App watermark is visible but tasteful.
'Just posted my Big 3 card, already got 12 DMs asking what app this is.'
Daily Variable Reading
Dopamine Prediction Error: unpredictable reward schedules are neurologically more compelling than predictable ones (same as TikTok's algorithm).
Reading varies in emotional weight and planetary significance each day. Rare events (eclipse, planet station) trigger special full-screen experience with different animation and deeper text. She can never predict what she'll get.
'I actually look forward to checking this every morning.'
Zeigarnik Progress Bar
Zeigarnik Effect: incomplete tasks create cognitive tension that compels completion.
'You've explored 6 of 10 planets in your chart ✦' visible on Chart tab. '4 of 12 houses unlocked.' Each unexplored section has a blurred preview. Tapping it reveals that planet's story. Progress feels like a game.
'I have 4 more planets to discover. Can't stop now.'
Retrograde Event Alerts
Scarcity + Urgency: Mercury Retrograde trends globally 4× per year. Being the app that tells her first makes you the authority.
3 days before: 'Mercury goes retrograde in 3 days ☿ — see exactly which area of your life is affected.' Full-screen special retrograde mode. Limited Survival Report for 5 days only. Eclipse, Venus Retrograde, Mars Retrograde same playbook.
'Every time I see Mercury Retrograde notifications I immediately check my app first.'
Cosmic Journal 📓
Sunk Cost + Autobiographical Memory: personal history in an app = powerful lock-in.
Daily mood log (5 stars + optional note). After 30 days: 'Your 3 best days were all when Jupiter was activating your 10th house. Your 2 hardest were Venus square Saturn — it's not you, it's the sky.' Retroactively connects her experiences to her chart.
'This app literally explained why last Tuesday was so bad. I was today years old when I found this out.'
Yearly Cosmic Wrapped 🎁
Endowment Effect + Social Virality: Spotify Wrapped is the most shared social content every December. Same mechanic, cosmic version.
December: animated 5-slide 'Your Year in the Stars' summary. Her dominant planet, peak month, cosmic archetype for the year, streak count, most-read feature. One-tap share to Stories. Premium = 12 full slides + downloadable poster.
'My Cosmic Wrapped just dropped 🌙 I got The Transformer as my 2026 archetype 😭'
Friend Compat Feed
FOMO + Social Relatedness: seeing her friends' cosmic energy creates conversation and community.
Her friends' daily cosmic energy shows as a strip on the Today tab. 'Your Sagittarius bestie is in a PEAK day ♐ Your ex has Saturn squaring his Venus today lol 🪐'. Opt-in only, not forced.
'I check my friends' cosmic energy every morning. My Scorpio friend and I always match up 😭'
Best Dates Calendar 📅
Future Pull: humans plan ahead. Giving her a reason to open the app on Wednesday (because it's her 'power day') is a powerful forward hook.
Weekly 'Your Best Day' sent Sunday evening. Monthly calendar in Forecast tab color-coded by energy level. Best date for important conversation / new project / self-care / romance each week.
'I actually scheduled my job interview on my Jupiter day and got the offer.'
Cosmic Birthday Alert 🎂
Delight through personalization: she will screenshot and share anything that feels truly made for her on her birthday.
On her birthday: 'Happy Solar Return ☀️ [Name]! The Sun just returned to the exact degree it was in the sky the moment you were born. Your new cosmic year begins now.' + Solar Return report offer.
'This app knew it was my cosmic birthday and I cried a little.'
 
 

🚀  VIRAL FEATURES — HOW SHE BRINGS HER FRIENDS
 
The most successful astrology apps (Co-Star, The Pattern) grew entirely through word-of-mouth with zero advertising. This is possible because the American girl actively talks about astrology with her friends. These five features are engineered to turn her love of astrology into organic installs.
 
Viral Feature #1 — The Big 3 Identity Share Card
✨  The Share Card — Your Primary Acquisition Engine (Zero Ad Spend)
✦  WHAT IT IS: A beautifully designed card showing her Sun ☀️ Moon 🌙 Rising ⬆️ placements with her 'Cosmic Archetype' title (e.g. 'The Transformer', 'The Dreamer', 'The Strategist', 'The Visionary')
✦  6 AESTHETIC STYLES: Dark Cosmic (for the Co-Star crowd), Rose Gold (Pinterest girl), Celestial Blue (ocean vibes), Earthy Sage (wellness girlie), Midnight Glam (going-out era), Pastel Dream (soft aesthetic). She picks her personality.
✦  WHEN IT TRIGGERS: Screen 8 of onboarding — immediately after her Big 3 are revealed one by one. Emotional peak. Share button appears instantly. She shares before she's even explored the app.
✦  THE LOOP: She posts to Instagram Stories → her followers see 'Scorpio Sun / Pisces Moon / Cap Rising ✦ [AppName]' → someone DMs 'what app is that?' → they download → do their own reveal → post their card → repeat.
✦  WATERMARK: App name subtly on the card in a font she'd never crop out because it looks like part of the design.
✦  US CONTEXT: 'What's your Big 3?' is the American girl's version of Myers-Briggs. She already has it in her bio. You're just making the existing behavior more visual and shareable.
✦  K-FACTOR: Estimated 0.3–0.5 new installs per share among US women 18–35. 1,000 users sharing = 300–500 free installs. This is Co-Star's entire growth strategy.
✦  REAL CO-STAR PROOF: 'Growth has been almost entirely word-of-mouth' — 25% of ALL US women 18–25 downloaded it this way. Same mechanic, better aesthetic, more personalized.

 
Viral Feature #2 — Compatibility Invite Loop
💞  Compatibility — Your K-Factor Engine
✦  THE MECHANIC: She wants to check her compatibility with a crush, a new guy, her best friend, her mom. To do it, she has to ask them for their birth time. That moment IS your acquisition.
✦  THE EXACT LOOP: She texts her friend: 'what time were you born? I want to check our astrology compatibility on this app 🌙' → friend asks 'what app' → friend downloads → friend checks their own compat with THEIR crush → cycle repeats.
✦  COMPATIBILITY SCORE DESIGN: Love (♀), Communication (☿), Values (♃), Long-Term (♄) — 4 scores, each out of 100%, each explained with real planetary aspects. Not vague. 'Your Venus in Scorpio trines her Moon in Pisces — emotional depth is your love language together.'
✦  CELEBRITY MODE (No invite needed): Pre-loaded charts for 500+ celebrities, athletes, musicians. 'How compatible are you with Harry Styles? Sabrina Carpenter? Travis Kelce? Zendaya?' Zero friction, zero needing anyone's birth time. Pure entertainment.
✦  SHAREABLE COMPAT CARD: 'We're 91% cosmically aligned 💫 Our superpower: emotional depth. Our challenge: stubbornness. #astrology @[AppName]' → goes to Stories → her followers want to check their own.
✦  MONETIZATION: Free = basic score + 3-line summary. Paid ($4.99) = full 25-page synastry report with chart image, aspect breakdowns, relationship evolution forecast. Every single compatibility check is a conversion moment.
✦  COUPLES MODE: Both partners in the app → joint home screen showing today's combined cosmic forecast. 'Today your energies are in harmony 💫' or 'Mercury is creating communication friction — don't start that conversation today.' She will make her boyfriend download this.

 
Viral Feature #3 — Daily Cosmic Status (BeReal Mechanic)
🌅  Daily Status — Ritual Retention + Social Virality
✦  INSPIRED BY: BeReal. A single daily notification at a randomized time creates a ritual that feels communal. 'What's your cosmic energy today?' replaces 'Take a BeReal.'
✦  HOW IT WORKS: Every day between 7–10am, all users get: 'Your cosmic status is ready ✦'. They open to receive a 3-word energy for the day.
✦  EXAMPLE DAILY STATUSES: 'FOCUS. BUILD. LEAD.' / 'REST. REFLECT. RELEASE.' / 'SPEAK YOUR TRUTH.' / '☿ RETROGRADE SHADOW — SLOW DOWN' / '🔥 PEAK POWER DAY' / 'VENUS ACTIVATED: YOU'RE THAT GIRL TODAY'
✦  FRIEND FEED: On the Connect tab, she sees her friends' cosmic statuses. 'Your bestie is having a PEAK day ♐ — she's thriving.' Creates daily conversation: 'omg we're both having a REST day, Mercury must be hitting Scorpios hard rn'
✦  SHARE TO STORIES: One tap → 3 bold words on a dark cosmic background, moon phase in corner, today's date, subtle app branding. Designed to look incredible on Stories.
✦  RETENTION SCIENCE: The randomized timing (7–10am window) means she checks the app any time in that window to 'not miss it.' This trains a daily habit loop within 2 weeks. Same psychological mechanism that made BeReal addictive.

 
Viral Feature #4 — Mercury Retrograde Event Marketing
☿  Retrograde Events — Your Recurring Spike Engine (4x Per Year)
✦  THE OPPORTUNITY: Mercury retrograde trends on Twitter/X 4 times per year. Every time, millions of American women search 'Mercury retrograde' and 'Mercury retrograde [sign]'. Google search volume spikes 300–500%. This is your quarterly moment.
✦  THE IN-APP EXPERIENCE: Countdown banner: 'Mercury goes retrograde in 3 days ☿ — see exactly which area of YOUR life is affected' → tap → shows which house Mercury transits in her natal chart → 'This affects your [3rd house / communication / siblings] specifically.'
✦  THE LIMITED REPORT: 'Mercury Retrograde Survival Guide' — personalized PDF. Exactly which life area is disrupted. What to avoid. What to lean into. Best and worst dates. Available 5 days before + during retrograde only. $2.99. Impulse price.
✦  THE CONTENT PLAY: Your social team posts: 'Mercury retrograde hits different for each sign — and even more specifically based on YOUR birth chart. Here's what each Rising sign should watch out for ✦' → tags app → drives downloads.
✦  RETROGRADE CALENDAR (All year): Mercury retro 4×, Venus retro 1×, Mars retro 1×, plus Jupiter/Saturn/Pluto/Uranus outer planet retrogrades. Each is an event moment. Each gets a limited in-app experience and report.
✦  ECLIPSE DOUBLE-DOWN: Solar and lunar eclipses (4–6/year) spike astrology search interest nearly as much as Mercury retrograde. Eclipse reports, eclipse journal prompts, 'Eclipse Season' home screen redesign.
✦  US CULTURAL RESONANCE: 'Mercury retrograde' is mainstream American humor at this point. 'Sorry I texted my ex, Mercury retrograde made me do it.' She is already primed for this content. You are the app that explains it specifically for HER chart.

 
Viral Feature #5 — Yearly Cosmic Wrapped
🎁  Yearly Wrapped — Your December Virality Bomb
✦  INSPIRED BY: Spotify Wrapped. For 5+ consecutive years it has been the single most shared piece of social content in December. The reason: it's personal, visual, and identity-affirming. Same energy, cosmic version.
✦  WHAT SHE SEES: A Spotify-style animated sequence. 5 slides (free) or 12 slides (premium). Each reveals a new stat: Biggest transit of her year → Peak month → Hardest planet that tested her → Cosmic archetype for the year → Number of days she checked her stars.
✦  FINAL SLIDE: Her custom 'Cosmic Year Poster' — beautiful dark design with her stats, shareable as a Stories card. 'My 2026 Year in the Stars 🌙 — The Transformer era. Saturn hit me hard in Q2 but Jupiter made it make sense.'
✦  RETENTION IMPACT: Users who stopped opening the app in September will open in December to see their Wrapped. Win-back rate estimated at 25–35% of churned users.
✦  ACQUISITION IMPACT: Every share shows the app name. Massive organic December spike each year. New users sign up in January to be ready for next year's Wrapped.
✦  MONETIZATION: Free = 5-slide preview with branding. Premium = 12-slide animated + downloadable high-res poster + share to Stories. Makes a premium subscription feel worth it in December.
✦  US TIMING: Launch the notification December 1st. 'Your 2026 Cosmic Wrapped is here ✨' — capitalize on the cultural moment when Spotify does theirs. Astrology Wrapped + Spotify Wrapped in the same week = double the Stories.

 
 

📱  EVERY SCREEN — FULL SPECIFICATION
 
Onboarding — 11 Screens, Zero Drop-Off
#
Screen
Exact UX
Her Psychology
Drop-Off Risk & Fix
1
Splash
Full dark screen. App name animates in gold serif font. Tagline: 'Know yourself better.' Soft particle animation (drifting star dust). 'Get Started' button. No login yet — pure emotional first impression.
She decides in 3 seconds whether this feels premium or cheap. Dark luxury cosmic aesthetic must immediately differentiate from every tacky horoscope app she's deleted.
RISK: Looks generic. FIX: Invest 80% of design budget on this screen's motion and typography. She will screenshot it if it's beautiful.
2
Sign Up
Apple Sign In (top, most prominent). Google Sign In below. Email fallback (collapsed, small text). No username required. No password required yet. Takes 2 taps maximum.
She has signed up for 50 apps. She knows this friction. Apple Sign In is how she does everything — make it effortless.
RISK: Email form with password = 40% abandonment. FIX: Apple Sign In converts 3× better. Make it the default.
3
Birth Date
Large, elegant scroll-wheel date picker. As she scrolls, it shows her zodiac season: 'You're entering Scorpio season ♏'. Stars shift in background. Bottom bar: 'Step 1 of 3 ✦'.
Easy win — she's done this thousands of times. Small delight (zodiac season preview) rewards her immediately.
RISK: None — this is the easiest input. Keep it fast and beautiful.
4
Birth Time
Time picker with large numerals. 'I don't know my birth time' is a PROMINENT button — not hidden, not apologetic. If selected: 'No worries — we'll create your chart with an estimated Rising sign. You can update it later.' Full continue.
THIS IS THE #1 DROP-OFF POINT for astrology apps. American women often don't know their birth time. Never block on this. The 'I don't know' option keeps her in the funnel.
RISK: Making 'don't know' feel shameful or inferior. FIX: Frame it as totally normal. 'Lots of people don't know — your chart is still incredibly accurate without it.'
5
Birth City
City search with instant autocomplete. Shows US city + state flag emoji (🇺🇸 for US cities). Map preview. 'Born outside a major city? Enter the nearest large city.' Smart enough to handle 'Austin, TX' vs 'Austin, MN' disambiguation.
She's from Austin or LA or Houston or San Diego — make her city appear immediately when she types 2 letters. This feels smart and fast.
RISK: International city formats confusing for US cities. FIX: Default country bias to US. Show state names clearly.
6
Your Name
Single field: 'What should we call you?' Large text preview: 'The cosmos await, [Name].' Optional — skip button visible. Note: 'Used only to personalize your readings, never shared or sold.'
The personalization preview (reading her name back) creates anticipation. She feels the chart is already being prepared for her.
RISK: Privacy concern. FIX: 'Never shared or sold' next to the field. First name only — no last name needed.
7
Calculating
Animated solar system. Planets orbit slowly. Cycling progress messages: 'Pinpointing your exact planetary positions...' → 'Mapping your 12 houses...' → 'Calculating aspects between planets...' Exactly 3 seconds (artificial delay).
The wait builds anticipation. It signals precision and effort. Makes the reveal feel earned. Rushed = feels cheap.
RISK: None — this is a designed moment. Keep the animation beautiful. Don't skip it.
8
THE BIG REVEAL ⭐
MOST IMPORTANT SCREEN. Full dark. Then: ☀️ 'Your Sun is in SCORPIO' animates in with a slow glow. 2-second pause. 🌙 'Your Moon is in PISCES' fades in. Pause. ⬆️ 'Your Rising is CAPRICORN' appears. Each with a 1-line keyword. Then all three together with her archetype title: 'The Transformer.'
THIS IS THE MOMENT. Design it like an Apple keynote. This is why she downloaded the app, why she'll tell her friends, why she'll screenshot it. Peak emotional impact — maximum investment.
RISK: She sees her sign and it's wrong (e.g., she's a cusp). FIX: Show exact degree. 'Sun in 18° Scorpio.' Educate gently: 'Western astrology places you here based on the Sun's tropical position at your birth.'
9
Personality Snapshot
3 bold one-line personality insights, revealed as cards one by one. Co-Star style — direct, slightly confrontational, specific. 'You transform through crisis, not comfort.' 'Your softness is your strategy, not your weakness.' 'You need depth or you need out.'
The moment she thinks 'how does it know me?' — this is where she becomes a believer. Must be specific enough to feel psychic, not generic enough to apply to anyone.
RISK: Too generic ('You are loyal and intense'). FIX: Write these for each Rising × Moon combo. 144 combinations. Make every one feel eerily specific.
10
Share Card
Her Identity Card displayed: Big 3, archetype title, beautiful design. 6 style options to swipe through. 'Share to Stories' big button. 'Share to Instagram' second option. 'Skip for now' visible. 'Show your girls who you really are ✨'
The viral trigger built INTO onboarding. She shares before she's explored anything. This is how Co-Star grew. Emotional peak + beautiful card = natural share moment.
RISK: Card looks cheap. FIX: This is worth 30% of your design budget. Make it so beautiful she'd never crop out the watermark.
11
Notifications + Trial
'Never miss a shift in your stars. Get your daily reading the moment you wake up.' Large Allow button. Then immediately after: 7-day free trial offer. Show what she's unlocking (blurred premium features). 'Start Free Trial — $7.99/mo after. Cancel anytime.'
Notification permission at peak emotional investment (post-reveal). Trial offer while she's most excited about the app. Show real value behind the blur so the upgrade feels obvious.
RISK: Showing price before showing value. FIX: She must see the Big Reveal + Personality Snapshot BEFORE seeing any paywall. The emotional investment comes first.
 
5 Core Tabs — Full Architecture
Tab
Owns This Need
Key Features (Selected)
Her Habit Pattern
TODAY
Morning ritual
AI daily reading pre-loaded. Cosmic streak. Power/Pressure/Caution trio. Moon phase. Friends energy strip. Daily planetary snapshot. Ask the Stars (premium). Best day preview.
Every morning before Instagram. 7-9am daily ritual.
CHART
Identity anchor
Interactive natal wheel. Wheel / Table / Aspect grid views. All 10 planets with sign, house, degree, retrograde. 12 houses explained. Transit overlay. Progress bar: planets explored. Download + share chart.
Returns when learning astrology, checking a placement, or sharing her chart.
FORECAST
Future pull
Transit timeline (color-coded by intensity). Monthly event calendar. Full retrograde tracker. Best dates for love / career / creativity / self-care. Eclipse tracker. Peak window highlight. Lunar calendar.
Sunday night planning. Before big decisions. During retrograde season.
CONNECT
Social + viral engine
Add friends via invite link. Friend chart cards with daily energy. Compatibility scores: Love / Communication / Values / Long-Term %. Full synastry. Celebrity charts: Taylor, Zendaya, Sabrina, Olivia + 500 more. Compatibility Share Card. Couples Mode.
New relationships. Celebrity obsession. Primary acquisition driver.
YOU
Identity vault
Profile card: Big 3 + archetype. Reports gallery (download / reshare). Cosmic journal with planetary overlay. Astrology learning path with progress %. Badge wall. Yearly Wrapped. Saved family/friend charts.
Rarely opened but deeply valued. High sunk-cost anchor.
 
 

⚙️  FULL TECHNICAL STACK — EVERY DECISION EXPLAINED
 
Complete Technology Decisions
Layer
Technology
Why This Choice
Key Implementation Detail
Mobile App
React Native (TypeScript) with Expo
One codebase for iOS + Android. Expo accelerates development. Massive US developer ecosystem. iOS-first by default (she's almost certainly on iPhone).
React Navigation 6 for routing. React Query for server state. Zustand for local state. Expo managed workflow for OTA updates without App Store review.
Chart Rendering
react-native-svg + D3.js
D3 handles all astrological math (house cusps, planet angles in SVG space). SVG renders the interactive wheel. Tap events on every glyph.
Custom hook: useNatalChart(chartJSON) → SVG coordinate system. Planet glyphs as SVG paths (standard Western symbols). Export to PNG for sharing.
Astrology Engine
Swiss Ephemeris (Python: pyswisseph)
The industry gold standard. Used by Co-Star. Based on NASA JPL DE431. Tropical zodiac output (Western only). 0.001 arc-second precision.
Dedicated Python FastAPI microservice. ALWAYS use tropical flag. Input: UTC datetime + lat/lng. Output: full chart JSON. Cache results in Redis.
AI Layer
Anthropic Claude API (claude-sonnet-4-6)
Best quality prose for American women's astrology content. Warm, smart, conversational without being mystical or clichéd. Cost-efficient at scale.
System prompt persona: professional western astrologer, modern American voice, Co-Star directness × Chani Nicholas depth. Cache by placement combo. ~$0.003/call.
Backend
Python FastAPI
Async, type-safe, fast. Pairs perfectly with pyswisseph (both Python). Auto-generates OpenAPI docs. Easy to deploy on AWS.
Microservices: /chart, /interpret, /reports, /transits, /notifications, /streaks. Docker containers per service. Shared JWT validation middleware.
Primary Database
PostgreSQL (AWS RDS)
Relational structure for users, charts, friends, subscriptions, reports, streaks, journal entries. JSONB for flexible chart storage.
Prisma ORM. chart_json as JSONB column — queryable without full fetch. Indexed on user_id for all tables. Multi-AZ for 99.99% uptime.
Cache
Redis (AWS ElastiCache)
Pre-generate all daily readings at midnight. Cache AI interpretation text by placement combo. Store streaks. User session tokens.
TTL: daily readings 24h, AI interpretations 30 days (same placement = same text, no re-calling Claude), city geocodes 90 days.
File Storage
AWS S3 + CloudFront CDN
Store generated PDFs, chart images, share card exports, yearly wrapped assets. CDN ensures fast delivery to US users (sub-50ms).
Pre-signed S3 URLs, 48-hour expiry for report downloads. CloudFront distribution with edge caches in US-East and US-West for her geography.
PDF Reports
ReportLab (Python)
Professional PDF generation with full layout control. Custom fonts, embedded chart images, branded cover pages.
matplotlib renders natal wheel PNG at 300 DPI → embedded in ReportLab. Cover page: her name, report type, date, app branding, cosmic background.
Auth
Firebase Auth
Apple Sign-In + Google Sign-In + email. react-native-firebase SDK. JWT tokens. She expects social login — this delivers it seamlessly.
Firebase UID maps to PostgreSQL user row. JWT verified server-side on every API request. Apple Sign-In prioritized (70%+ of US women her age are on iPhone).
Push Notifications
Firebase Cloud Messaging (FCM)
Free, cross-platform, reliable. Handles the single most important feature: her morning daily reading push.
Midnight cron: generate all users' daily texts → store in MongoDB → FCM sends at each user's learned optimal open time (default 7:45am local).
Payments
RevenueCat
Handles App Store (IAP) and Google Play billing complexity. Entitlements API tells the app in real-time what she's paid for. Revenue analytics built in.
Free tier up to $2,500 MRR, then 1%. Entitlements: basic_premium, all_reports, ask_the_stars, couples_mode. Webhook to backend on subscription events.
Geocoding
Google Places API + Google Time Zone API
US-optimized autocomplete. Handles Austin TX vs Austin MN disambiguation. Time Zone API resolves DST correctly — critical for accurate US birth chart calculations.
Cache lat/lng + UTC offset in Redis per city. ~$0.002/request. US city data pre-cached on cold start. Budget: $50–150/month at full scale.
Analytics
Mixpanel
Event-level user tracking. Funnel analysis (onboarding drop-off), A/B notification copy, cohort retention curves, revenue attribution.
Core events: chart_generated, onboarding_completed, share_card_tapped, report_purchased, streak_milestone, paywall_seen, trial_started, subscribed, churned.
Infrastructure
AWS (ECS Fargate + Lambda + RDS + ElastiCache)
ECS Fargate: FastAPI containers auto-scale to her usage. Lambda: cron jobs (midnight daily generation). API Gateway: rate limiting and auth.
GitHub Actions CI/CD. Staging environment mirrors production. Blue-green deploys. Auto-scale triggers at 70% CPU on Fargate tasks.
App Store Strategy
Fastlane + App Store Connect + Apple Search Ads
Automated builds and App Store submission. Apple Search Ads targets 'astrology app', 'birth chart', 'daily horoscope' keywords — these are her exact searches.
App Store keywords: birth chart app, daily horoscope, astrology chart, Co-Star alternative, natal chart reading. Category: Lifestyle. Screenshots show dark cosmic aesthetic immediately.
 
 

📄  REPORTS — HER PREMIUM PURCHASES
 
A report is the highest-value thing your app can produce. It's permanent, downloadable, giftable to a friend, and represents the moment a free user decides this app is worth real money. A user who downloads one report is 3× more likely to subscribe.
 
Report Catalog — Optimized for American Women
Report
Tier
Price
Pages
What She Gets
Her Use Case
Natal Chart Report
FREE
$0
10–14
Chart wheel image, planet positions table, Sun/Moon/Rising interpretations, dominant element/modality, Big 3 archetype title.
Acquisition driver — this is the free gift that proves the app is worth trusting. She sends this to her friends.
Full Birth Chart Analysis
PREMIUM
$7.99
35–45
All 10 planets × sign × house (300-word interpretation each), all major aspects explained, house-by-house life map, dominant patterns, synthesis of her full chart story.
The purchase she makes when she's ready to go deep. Her most personal document. She reads it multiple times.
Year Ahead Forecast
PREMIUM
$9.99
22–30
Month-by-month transit narrative, quarterly themes, peak power periods, caution zones, best dates for love / career / creativity / health, solar return chart.
January 1st purchase. Major life decision moments. 'What does this year hold for me?'
Compatibility Report
PREMIUM
$7.99
25–35
Synastry biwheel chart, aspect-by-aspect love language analysis, Love / Communication / Values / Long-Term scores, composite chart, relationship growth map.
New relationship. Situationship she's analyzing. Gift to a couple. 'Are we actually compatible?'
Love Blueprint
PREMIUM
$7.99
18–22
Venus placement + love style, Mars placement + desire nature, Venus-Mars aspect, 5th house (romance), 7th house (partnership), attachment patterns, 'what she needs vs what she attracts.'
Single and trying to understand her patterns. After a breakup. Valentine's Day gift to herself.
Career & Life Purpose
PREMIUM
$9.99
16–20
Midheaven + 10th house (career identity), 6th house (work style), Saturn (discipline + challenge), Jupiter (expansion zone), North Node (soul direction), career timing.
Saturn Return age (27–29). Career crossroads. 'What am I actually meant to do?'
Monthly Transit Report
PREMIUM
$3.99
8–10
This month's transits to her natal chart, key dates, do/don't per week, lunar cycle guidance, intensity forecast per life area.
The report that converts free users to subscribers when they realize they want this every month.
Solar Return (Birthday)
PREMIUM
$5.99
12–16
Birthday chart for her coming year, dominant theme, activated houses, conjunctions to natal chart, month-by-month preview, 'your cosmic mission this year.'
Birthday — triggered by push notification. High open rate, impulse purchase. She shares it.
Retrograde Survival Guide
SEASONAL
$2.99
6–8
Which retrograde affects her chart most, affected houses/life areas, survival strategies, what to avoid vs lean into, best and worst dates during retrograde.
Limited 5-day window per retrograde event. Impulse price point. 4 Mercury retrogrades/year = 4 recurring revenue spikes.
Relationship Patterns Deep Dive
PREMIUM
$7.99
18–22
7th house ruler analysis, Venus-Mars dynamics, Juno and Chiron in love, attachment style through chart, why she keeps attracting the same type, how to break the pattern.
Post-breakup. Therapy supplement. 'Why do I always date the wrong person?' — answering this is extremely high value to her.
 
 

💰  MONETIZATION — PRICING & REVENUE IN USD
 
American women under 35 are experienced digital consumers. They have multiple subscriptions. They pay for quality wellness apps without thinking twice. The key is: price must feel like a no-brainer relative to the value — not cheap enough to feel suspicious, not expensive enough to require a decision.
 
Pricing Architecture
Tier
Price
What She Gets
Her Decision Moment
Revenue Target
Free
$0
Natal chart + Big 3 reading. Daily sun-sign horoscope (not personalized to full chart). Basic compatibility score. Share card. Streak tracking.
Every new user. The 'taste' tier. She experiences the app before committing.
~65% of users
Basic — Monthly
$5.99/mo
Full personalized AI daily reading. All 5 tabs unlocked. Retrograde alerts. Unlimited compatibility. Best dates calendar. 1 report credit/month.
7-day free trial converts her. 'Less than a latte' framing. This is your volume tier.
~20% of users
Basic — Annual
$39.99/yr ($3.33/mo)
Same as monthly. Annual saves her $31.90. Discounted on sign-up and at renewal.
'Smart choice' framing. 40% of monthly subscribers convert to annual when shown the comparison.
~10% of users
Premium — Monthly
$11.99/mo
Everything in Basic + Ask the Stars (AI Q&A), Couples Mode, all reports (3 free/mo), full Yearly Wrapped, priority report generation, Astrologer chat access.
'Serious astrology girl' tier. She upgrades when she realizes she uses this every day.
~4% of users
Premium — Annual
$79.99/yr ($6.67/mo)
Everything in Premium monthly. Annual saves $63.89 vs monthly. Best value badge shown.
Converts at Saturn Return age group (27–29) — they're in a period of deep chart study.
~1% of users
Pay-Per-Report
$2.99–$9.99 each
Any report from the catalog without a subscription. Impulse pricing.
Mercury retrograde → $2.99 Survival Guide. Birthday → $5.99 Solar Return. No subscription needed.
~15–20% of revenue
Gifting
$7.99–$14.99
'Gift a chart reading to someone you love.' Digital gift card. Sent via text or email.
Valentine's Day, birthdays, 'thinking of you.' New-user acquisition with payment attached.
~5% of revenue
Live Astrologer Chat
$15–45/session
15–45 min session with verified US-based western astrologer. In-app booking + video/chat.
Saturn Return, major life decision, birth of a child, major breakup — high willingness to pay.
~10% of revenue
 
App Store Optimization — Finding Her
🔍  Her Exact Search Terms in the App Store
✦  PRIMARY KEYWORDS (highest volume): 'birth chart app', 'astrology app', 'daily horoscope', 'natal chart reading', 'Co-Star alternative'
✦  SECONDARY KEYWORDS: 'birth chart reading', 'mercury retrograde app', 'venus placement', 'rising sign calculator', 'synastry chart', 'compatibility astrology'
✦  LONG TAIL (high intent, lower competition): 'personalized birth chart AI', 'full birth chart with houses', 'saturn return astrology', 'venus retrograde tracker'
✦  APP STORE TITLE FORMAT: '[App Name]: Birth Chart & Daily Horoscope' — puts the two highest-search keywords in the title
✦  SUBTITLE (30 chars): 'Natal Chart · AI Readings · Stars' — keywords she scans for in search results
✦  FIRST SCREENSHOT: Must show dark cosmic aesthetic + 'Your Sun is in Scorpio' type reveal — she decides on the screenshot before reading any copy
✦  DESCRIPTION OPENING: 'Not generic horoscopes. Your actual birth chart, read by AI.' — speaks directly to her frustration with every other app
✦  APPLE SEARCH ADS: Bid on 'Co-Star', 'birth chart app', 'daily horoscope app', 'astrology chart' — exact match. Her highest-intent search moments.

 
 

🔔  NOTIFICATION PLAYBOOK — IN HER VOICE
 
Notifications are the most intimate marketing channel you have. Done right, she looks forward to them. Done wrong, she disables them in 3 days and you've lost your most powerful retention tool. Every word below is optimized for the American girl.
 
Complete Notification Copy — US Voice
Type
Timing
Gen Z Copy (18–24)
Millennial Copy (25–35)
Why It Works
Morning Reading ☀️
7:45am local (learns her pattern)
'venus is doing something interesting in your chart today. you might want to check it 🌙'
'Venus activates your 5th house today — this is your window for creative and romantic energy.'
Variable reward: she doesn't know if it's a power day or a challenging one until she opens.
Streak Saver 🔥
9:00pm if not opened
'your 🔥21-day streak ends tonight, babe. don't let the cosmos wait.'
'Your 21-day cosmic streak closes in 3 hours. One minute to keep it alive.'
Loss aversion is universal — but tone matches her generation exactly.
Mercury Retrograde ☿
3 days before + day of
'mercury retrograde starts in 3 days ☿ which area of your life is cooked? check your chart.'
'Mercury stations retrograde in 72 hours — it's activating your [3rd house]. Here's exactly what to watch.'
Event-specific to HER chart, not a generic 'mercury is retrograde' message.
Full Moon 🌕
Day of (evening)
'full moon in [sign] tonight 🌕 it's lighting up your [house] house. feel anything?'
'Tonight's Full Moon in [sign] illuminates your [house] house of [theme]. What needs releasing?'
Celestial events feel sacred. Timed for evening introspection.
Best Day of Week 📅
Sunday 8:00pm
'your best day this week is thursday. don't schedule anything stressful. it's for YOU. ✦'
'This week, Thursday carries your strongest planetary support. Here's why and how to use it.'
Forward pull — she now has a reason to return Thursday. Creates a weekly appointment.
Solar Return 🎂
Her birthday (morning)
'happy solar return bestie ☀️ the sun just returned to your exact birth degree. this is YOUR year starting now.'
'Happy Solar Return, [Name]. The Sun has completed its journey and returned to your birth point. Your new cosmic year opens today.'
The app remembered her cosmic birthday. This feels deeply personal. She screenshots and shares.
Re-engagement 🌙
Day 3 of absence
'the moon changed signs twice while you were gone 👀 also — something shifted in your chart. come see.'
'Three planetary transits have moved through your chart since your last check-in. Here's what the sky has been doing.'
FOMO framing around what she missed — not guilt about absence. Shame-free reactivation.
Friend Activity 💞
When friend has notable transit
'your [sign] bestie is having THAT kind of day ✨ cosmic alignment hits different rn'
'[Friend] is navigating a Jupiter peak today — your energies are running parallel this week.'
Social pull: seeing her friend's cosmic state makes her want to check her own.
Venus Retrograde ♀
First day of retrograde
'venus is retrograde starting today 🚨 your love life, money, and aesthetics just entered slow motion. here's your [sign] survival guide.'
'Venus stations retrograde today — reviewing values, relationships, and self-worth for the next 40 days. Your chart shows [house] is most affected.'
Venus retrograde is deeply relevant to her love life — highest click-through of any retrograde notification.
 
Notification Rules — Never Get Disabled
📐  10 Rules for Notifications She Looks Forward To
✦  RULE 1 — PERSONALIZE OR DON'T SEND: 'Your Venus in Scorpio is activated today' gets 25%+ open rate. 'Daily horoscope ready' gets 5%. Her name + her placement + today's event = the only formula that works.
✦  RULE 2 — MAXIMUM 1 PER DAY: Never send more than one notification per day in the first 30 days. Earn the right to increase with engagement data.
✦  RULE 3 — LEARN HER TIMING: Track when she first opens each morning. Shift her daily notification to match. Duolingo found optimal-time delivery increased opens 28%. Do the same.
✦  RULE 4 — NEVER GUILT, ALWAYS INTRIGUE: 'You missed 3 days' = deleted immediately. 'The moon moved into your rising sign while you were away' = she taps it. Always frame around what happened, not what she didn't do.
✦  RULE 5 — RETROGRADE EVENTS ARE SACRED: She already cares about these before your app. Your notification is the authority voice she trusts. Make it specific to her chart every time.
✦  RULE 6 — GEN Z TONE vs MILLENNIAL TONE: A/B test notification copy by age from onboarding data. They respond differently to the same event. Track open rates by age cohort in Mixpanel.
✦  RULE 7 — NOTIFICATION OPT-IN CATEGORIES: Let her choose: Daily Reading / Planetary Events / Streak Reminders / Friend Activity / Special Events. Choice = lower disable rate.
✦  RULE 8 — EMOJI ARE NOT OPTIONAL FOR GEN Z: Her TikTok feed communicates in emoji. Your notifications must too. 🌙☿🔥✨💫♀☀️ — these are her visual language.
✦  RULE 9 — SPECIFICITY OVER VOLUME: One specific notification about Venus activating her 5th house beats 5 generic 'check your daily reading' notifications.
✦  RULE 10 — HOLIDAY + CULTURAL MOMENTS: New Moon in Aries (astrological new year, March) = biggest cosmic notification of the year. Mercury Retrograde in Scorpio (October) = Halloween season + dark intensity = her aesthetic peak. Time your best content here.

 
 

🗓️  LAUNCH ROADMAP — IDEA TO HER HOME SCREEN
 
5-Phase Development Plan
Phase
Timeline
What Gets Built
Milestone
Budget (USD)
Phase 0
Design
Weeks 1–4
Figma full prototype of all 30+ screens. Design system: color palette (dark cosmic), typography, component library. User test with 20 American women (10 Gen Z, 10 Millennial) from TX and CA specifically. Iterate on Big Reveal screen and Share Card above everything else.
Validated clickable prototype. Share Card tested on real Instagram accounts to confirm share rate. Design hand-off to devs.
$8K–$18K
Phase 1
MVP Core
Weeks 5–16
Auth (Apple + Google Sign-In). Full 11-screen onboarding. Swiss Ephemeris chart engine. Claude AI daily reading. Interactive natal chart wheel. Share Card all 6 styles. Streak tracking. Free natal PDF report. Push notifications for daily reading + streak.
TestFlight (iOS first) soft launch to 500 invited US women. Mixpanel funnels live. Iterate weekly based on data.
$35K–$55K
Phase 2
Engagement
Weeks 17–26
All 5 tabs complete. Compatibility system + friend invites. Celebrity chart library (500 charts pre-loaded). Cosmic journal. Full streak + achievement badges. All 5 viral features. BeReal-style daily status. Yearly Wrapped MVP.
Public App Store launch. Target: 10,000 US downloads in month 1. K-factor > 1.0. TikTok creator seeding campaign.
$22K–$38K
Phase 3
Monetisation
Weeks 27–34
All 10 report types with full PDF pipeline. RevenueCat subscription tiers ($5.99/$11.99). 'Ask the Stars' AI Q&A. A/B paywall testing. Retrograde event limited reports. Birthday Solar Return push. Apple Search Ads campaign.
Target: $15K MRR. 5%+ free-to-paid conversion. First Mercury retrograde campaign spike. App Store reviews > 4.7 stars.
$18K–$28K
Phase 4
Scale
Weeks 35–52
Live astrologer marketplace (US-based western astrologers only). iOS home screen widget (daily cosmic reading). Couples Mode full build. Apple Watch complication (moon phase + daily word). PR push around next Mercury retrograde. Podcast ad campaign targeting astrology/wellness shows.
Target: $50K MRR. 100K registered US users. PR feature in Cosmopolitan, ELLE, or similar. App Store 'Featured App' submission.
$28K–$50K
 
US Growth Channels — How She Finds You
Channel
Tactic
Why It Works for Her
Budget & Timing
TikTok Seeding
Send early access to 20 US astrology TikTok creators (50K–500K followers). Give them 30 days to genuinely use the app before posting. Supply their Big 3 card and personalized reading as content starter.
This is how Co-Star hit 20M downloads with $0 marketing. TikTok astrology is a massive subculture. Creators have authentic audiences of your exact user.
Free product + $500–2K per creator. Launch before Phase 2 public launch.
Share Card Organic
The Share Card built into onboarding IS your marketing channel. Every Instagram Stories post is an ad. Make the card so beautiful she'd never want to not post it.
Co-Star proved this model. 25% of all US women 18–25 downloaded it purely from seeing friends' posts. Zero cost, unlimited scale.
$0 ad spend. Pure design investment.
Apple Search Ads
Bid on: 'birth chart app', 'daily horoscope', 'astrology app', 'co-star' (competitor), 'natal chart reading'. Exact match. US only. iOS only.
She searches for astrology apps in the App Store — this is where she has purchase intent. Apple Search Ads converts 2–4× better than social ads for app installs.
$2K–$5K/month after Phase 3 launch.
Mercury Retrograde PR
Every Mercury retrograde, pitch Cosmo, ELLE, Refinery29, Bustle, and Gloss Angeles a story: 'This AI app tells you exactly how Mercury retrograde affects YOUR chart — not just your sun sign.'
These publications write Mercury retrograde content every time. Getting featured in one article = 50K–200K impressions from exactly your audience.
PR outreach ($0–$2K) timed 2 weeks before each retrograde.
Reddit r/astrology
Genuine participation in r/astrology (900K+ members), r/birthcharts, r/AskAstrologers. Don't spam — be helpful. When the app launches, a transparent 'I built this' post with free access converts extremely well.
r/astrology is full of your exact user. American women who are serious about western astrology. High trust, ad-resistant — genuine community posts outperform any paid campaign.
$0. Relationship-building starts in Phase 0.
Podcast Ads
Target astrology and women's wellness podcasts: 'The Astrology Podcast', 'Cosmic Cousins', 'Oh No Ross and Carrie', 'School of Greatness', 'We Can Do Hard Things', 'Call Her Daddy'. 30-second mid-rolls.
Podcast listeners are committed — they sit through 30-second ads from brands they trust the host to vouch for. Her podcast diet overlaps heavily with your product.
$1K–$5K per podcast per campaign. Phase 4 timing.
 
Key Success Metrics — Optimized for US Market
Metric
What It Measures
Phase 1
Target
Phase 3
Target
US Benchmark
DAU / MAU
Daily / Monthly actives. Shows whether she's made it a daily habit or just a download.
18%
32%+
Duolingo 55% · Co-Star est. 30–40%
Day 7 Retention
% still opening 7 days after install. Most important early signal of a true habit.
28%
42%+
Top lifestyle apps: 35–45%
Day 30 Retention
% still active 30 days in. Proves the streak mechanic is working.
14%
24%+
Top apps: 20–25%
Free → Paid Conversion
% who subscribe or purchase within 30 days of install.
2.5%
6%+
Co-Star est. 3–5% · US astrology avg: 5–8%
Viral Coefficient (K)
Average new users each user brings in. K > 1.0 = self-sustaining viral growth.
0.4
1.1+
Co-Star peak: ~1.2 (word-of-mouth only)
Share Card Share Rate
% of users who tap 'Share' on their Big 3 card in onboarding.
20%
35%+
Target: 1 in 3 new users shares immediately
Streak 7-Day Rate
% who maintain a 7+ day streak in their first month.
22%
38%+
Duolingo 40% · Target: match Duolingo within 12 months
Report Purchase Rate
% who buy or download at least 1 report (free or paid).
35%
60%+
Key retention signal — report buyers churn at 4× lower rate
Push Open Rate
% of push notifications opened. Personalized astro = significantly above average.
18%
28%+
Industry avg: 5–8%. Personalized lifestyle: 20–35%
ARPU (Monthly)
Average Revenue Per User across all free + paid. North Star monetization metric.
$0.80
$3.50+
Co-Star est. $3–5. Top US lifestyle apps: $4–8
 
 

 
✦  ☽  ✦
THE AMERICAN GIRL BLUEPRINT — COMPLETE
10 Sections  ·  Western Astrology Only  ·  USD Pricing Throughout  ·  Texas & California Optimized
She already loves astrology. Build the app she deserves.
