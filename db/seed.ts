import { db } from './index'
import { config } from 'dotenv';
import { resolve } from 'path';
import { supervisors, fellows, sessions, batchJobs } from './schema'
import { eq } from 'drizzle-orm'

// Run this for db:seed npx dotenv -e .env -- npx tsx db/seed.ts

config({ path: resolve(__dirname, '../.env') });

// ─── Mock Transcripts (40-60 min sessions, ~6000-9000 words each) ─────────────

const GROWTH_MINDSET_TRANSCRIPT = `
[Session Recording - Group Therapy Session]
[Date: 2024-11-15, Duration: 52 minutes]
[Fellow: Amara Osei, Group ID: GRP-001-ACCRA]

AMARA: Good afternoon everyone! Welcome back to our Thursday session. I'm so happy to see all of you here today. Let's start by checking in. How is everyone feeling today on a scale of one to five, where one is very difficult and five is feeling great? Kofi, would you like to start?

KOFI: Hmm, I'd say a three today. Had a tough morning with school but I'm glad to be here.

AMARA: Thank you for sharing that, Kofi. It takes courage to show up even when mornings are tough. Esi?

ESI: Maybe a four. I did well on my math test yesterday and I'm feeling good about it.

AMARA: That's wonderful, Esi! We'll definitely celebrate that. Kwame?

KWAME: I'm at a two today. I failed my football tryout and I just feel like I'm not good enough at anything.

AMARA: Kwame, thank you for being honest with us. That's exactly the kind of thing we want to talk about today, because today's session is about something very important - Growth Mindset. Has anyone heard that term before?

[Multiple participants indicating uncertainty]

AMARA: That's perfectly okay! Growth mindset is an idea developed by a psychologist named Carol Dweck. She studied thousands of students and discovered something amazing - the way we think about our abilities actually changes what we can achieve. So let me ask you this: when you hear Kwame say he's "not good enough at anything" - what kind of thinking does that sound like to you?

ADWOA: Like he's given up?

AMARA: That's a really insightful observation, Adwoa. It sounds like what we call a "fixed mindset" - the belief that our abilities are set in stone, that we either have talent or we don't. But here's what the research shows us, and this is really exciting - our brains are actually like muscles. They can grow and get stronger with practice and effort.

KOFI: But some people are just naturally smarter, aren't they? Like in my class, Emmanuel always gets the top marks without trying.

AMARA: That's such a great question, Kofi, and it's one that trips a lot of people up. Let me share something with you. Even people who seem naturally talented - athletes, musicians, top students - they have a story of practice and failure that we usually don't see. Do you know who Michael Jordan is?

[Group affirms yes]

AMARA: Michael Jordan was cut from his high school basketball team. The person many consider the greatest basketball player in history - cut. What do you think he did after that?

KWAME: He practiced more?

AMARA: Exactly! He used that failure as fuel. He said, and I want you to remember this, "I have failed over and over and over again in my life. And that is why I succeed." Now, I want us to do an activity together. I'm going to give each of you a piece of paper. On one side, I want you to write down a fixed mindset thought you've had about yourself - something like "I'm bad at math" or "I can't make friends." And on the other side, I want you to rewrite it as a growth mindset thought. Can we try that?

[15 minute activity period - participants writing]

AMARA: Okay, who wants to share? Ama, I saw you writing very thoughtfully over there.

AMA: I wrote "I'm terrible at public speaking" on one side. And then for the growth mindset I wrote... "I haven't practiced public speaking much yet, but I can improve."

AMARA: That is absolutely perfect! Did everyone notice what Ama did? She added the word "yet." That tiny word - yet - is one of the most powerful words in the growth mindset toolkit. I'm not good at this... yet. Kwame, would you be willing to share yours?

KWAME: I wrote "I'm not athletic enough" on the fixed side. And on the growth side... "I didn't make the team this time, but if I practice my footwork and speed, I have a better chance next tryout."

AMARA: Kwame, that is incredible. How does it feel to read that back to yourself?

KWAME: [pause] Actually... a little better. Like there's something I can do about it.

AMARA: That's the power of growth mindset. It gives us agency - the sense that our actions matter. Now I want to talk about something called the brain and neuroplasticity. This is a scientific word but I promise it's not scary. Neuroplasticity means the brain's ability to reorganize itself by forming new neural connections. Every time you try something new, struggle with something, or practice a skill, your brain is literally building new pathways.

ESI: So like, when I was struggling with algebra and then I finally understood it, my brain actually changed?

AMARA: Exactly! Your brain formed new connections. Scientists can actually see this happening with brain scans. Isn't that incredible? You are literally changing your own brain when you learn. Now, I want to introduce another concept - the difference between effort praise and intelligence praise. Research shows that if someone tells a child "you're so smart" when they succeed, the child actually becomes less resilient. But if someone says "you worked really hard at that," the child is more likely to take on challenges. Who in your life praises you? How do they praise you?

[Group discussion, approximately 10 minutes]

ADWOA: My mum always says "you're so clever" but then when I struggle I feel like a fraud, like maybe I'm not as clever as she thinks.

AMARA: Adwoa, what you just described is something called "imposter syndrome" and it's really common. And it often happens because of the kind of praise we receive. What would be more helpful than "you're clever"?

ADWOA: Maybe... "you worked hard" or "you kept trying"?

AMARA: Yes! Process praise. Praising the process, not the fixed trait. Now I want to check in with everyone - how are we feeling? Are there any questions so far?

KWAME: Can you actually change if you're already bad at something for a long time?

AMARA: That is the best question, Kwame. And the answer is yes - with some important nuances. The brain maintains plasticity throughout life, though it's highest in youth - which is actually good news for all of you. Studies have shown adults learning new languages in their 50s and 60s and becoming fluent. Musicians developing significant skill after starting at 40. Now, it might take more time and effort. And some things might be harder for some people due to various factors. But the key research finding is this: effort and strategy matter more than innate ability in most domains of life. 

Let me share a story. There was a young man in Chicago - we'll call him Marcus - who failed fifth grade. His teachers said he had learning difficulties. His family didn't have resources for extra support. But Marcus believed he could change. He got to the library every day after school. He asked for help. He failed many times. By the time Marcus was 25, he had a degree in engineering. His brain hadn't changed - or rather, it had changed dramatically, through effort.

ESI: That's really inspiring.

AMARA: I share it because I want you to know that your circumstances, your past performance, even your current performance - none of that determines your future. That's the radical promise of growth mindset.

Now, before we close, I want to do our affirmation practice. We're going to each say one growth mindset statement about ourselves for the coming week. Something you're going to work on. Kofi?

KOFI: This week, I'm going to ask my teacher for help in chemistry instead of pretending I understand.

AMARA: Beautiful. Esi?

ESI: I'm going to try joining the debate club even though I'm nervous about public speaking.

AMARA: Amazing, Esi! Adwoa?

ADWOA: I'm going to fail at something on purpose - try something I know I'll struggle with - and not let it ruin my day.

AMARA: That is one of the most sophisticated growth mindset exercises I've heard. Kwame?

KWAME: I'm going to start training every morning before school for the next tryout. Even if it's hard.

AMARA: Kwame, I am so proud of what you've done in this session today. You came in feeling like a two and look at the commitment you're making. That is growth mindset in action, right now, in this room.

Let me give you your homework before we go. I want each of you to keep a "yet journal" this week. Whenever you have a fixed mindset thought - "I can't do this" or "I'm not good at that" - write it down and add the word "yet." And notice how it changes how you feel. Can everyone do that?

[Group affirms]

AMARA: Wonderful. Before we close, I want to check in one more time. How is everyone feeling now? Kwame?

KWAME: I'm at a four now. I feel like there's something I can actually do.

AMARA: That makes my heart so happy. Everyone, you all showed incredible courage and wisdom today. I'll see you next Thursday. Take care of yourselves this week.

[Session ends]
[Fellow notes: Strong engagement throughout. Kwame showed significant emotional shift. Concept covered comprehensively with evidence-based examples. Group dynamics positive. Esi's debating club intention should be followed up next session.]
`

const EMOTIONAL_REGULATION_TRANSCRIPT = `
[Session Recording - Group Therapy Session]
[Date: 2024-11-18, Duration: 58 minutes]
[Fellow: Yaw Mensah, Group ID: GRP-002-KUMASI]

YAW: Good morning everyone. I can see we have the full group today - that's fantastic. Before we begin, how is everyone doing? Quick check-in, just a feeling word or a number.

ABENA: Anxious. Seven out of ten anxious.

YAW: Thank you, Abena. That's actually really relevant to today's topic. Kojo?

KOJO: I'm good. Maybe a two on the scale? Feeling calm.

YAW: That's great Kojo. Akosua?

AKOSUA: I don't know. In between. My parents were fighting again last night and I couldn't sleep.

YAW: I'm really glad you shared that, Akosua. It takes a lot to share something like that, and I hear you. We're going to talk about something today that I hope will be helpful for you and for everyone. Today's topic is emotional regulation.

Now, before I explain what that means, I want to start with a question. Has anyone ever felt an emotion that was so strong it felt like it was controlling you? Like the emotion was driving the car and you were just a passenger?

[Multiple participants raise hands or affirm]

YAW: Can someone give me an example? You don't have to share anything too personal.

KWEKU: Sometimes when my brothers tease me I get so angry I just want to shout and break things. And then afterwards I always regret it.

YAW: Kweku, that is such a perfect example, and I want to thank you for your courage in sharing it. What you're describing is what psychologists call an amygdala hijack. Let me explain what that means. In our brain, we have a part called the amygdala - it's like our alarm system. When we feel threatened, stressed, or overwhelmed, the amygdala fires up and floods our body with stress hormones. This happens before our thinking brain - the prefrontal cortex - even has a chance to respond.

So when Kweku's brothers tease him, his amygdala says "DANGER" and his body goes into fight response - that anger, that urge to break things - before his thinking brain can say "wait, these are just my brothers teasing me, this isn't actually dangerous."

ABENA: So it's not our fault when we do things in anger?

YAW: That's such a nuanced question, Abena, and the answer is complex. The initial emotional response isn't fully within our control - our amygdala fires automatically. But we do have the ability to learn skills that help us respond differently. And that's what emotional regulation is: the ability to recognize, understand, and manage our emotions and how we express them. Not suppressing emotions - they're all valid - but choosing how we respond to them.

AKOSUA: But how? When I'm upset about my parents, I can't just... turn it off.

YAW: You're absolutely right that you can't turn it off, Akosua, and I would never want you to try. Emotions are important signals. But we can learn to work with them rather than be controlled by them. Let me teach you the first technique: the STOP method.

S - Stop. Just literally pause for one second.
T - Take a breath. One deep breath.
O - Observe. What am I feeling? Where do I feel it in my body?
P - Proceed mindfully.

Can we practice this right now together? Let's all take a deep breath. In through the nose... hold... out through the mouth. Now, what did you notice in your body just then?

KOJO: My shoulders dropped a bit.

YAW: Yes! Physical tension releasing. Abena?

ABENA: I noticed my stomach felt a bit less tight.

YAW: That's the parasympathetic nervous system activating - your body's natural calming response. When we breathe deeply, we literally send a signal to our brain that says "we're safe, you can calm down now." This is not just meditation talk - this is biology.

Now I want to teach you something called the Window of Tolerance. This is a concept from trauma therapy that I find incredibly useful. Imagine a window. Inside the window is where we feel okay - we can think clearly, feel emotions without being overwhelmed, function normally. Above the window is hyperarousal - too activated, anxious, panicked, raging. Below the window is hypoarousal - shut down, numb, dissociated, frozen.

[Draws diagram on whiteboard]

YAW: Emotional regulation is the skill of staying inside the window, or of returning to it when we've gone above or below. And everyone's window is a different size. Someone who had a very stable, safe childhood might have a wide window - they can handle a lot of stress and still stay regulated. Someone who experienced a lot of difficulty might have a narrower window, and things that seem small to others can push them out of the window.

AKOSUA: So it's not weakness if we get dysregulated?

YAW: Absolutely not. It's neuroscience. It's your body doing exactly what it was designed to do based on your experiences. And here's the important thing: we can widen the window. Through practice, through therapy, through the kinds of sessions we do here - we are literally rewiring our nervous systems to handle more.

Let me share a technique for when you're above the window - highly anxious or angry. It's called the 5-4-3-2-1 grounding technique. It works by engaging your senses and bringing you back to the present moment, because anxiety is usually about the future and depression about the past. Being present interrupts both.

Name 5 things you can see. 4 things you can feel. 3 things you can hear. 2 things you can smell. 1 thing you can taste.

Can we try it right now?

[Group engages in grounding exercise for approximately 5 minutes]

YAW: How did that feel?

KWEKU: Weird at first but then... I kind of forgot what I was worried about?

YAW: That's exactly the point. We can't worry about the future and be fully present at the same time. Our brain doesn't have the bandwidth.

Now I want to address something important. Sometimes our emotions are telling us something crucial. If Akosua's parents are fighting and she feels scared and can't sleep - that emotional response is appropriate and valid. Emotional regulation doesn't mean pretending everything is fine. It means being able to feel those feelings without them overwhelming you to the point where you can't function.

AKOSUA: Sometimes I feel like I have to be okay because my younger siblings look to me.

YAW: Akosua, that is a heavy burden to carry. Can I share something? You cannot pour from an empty cup. If you don't take care of your own emotional regulation, you won't be able to help your siblings either. And taking care of yourself is not selfish - it's necessary.

I want to check in here - how is everyone doing? Is anyone finding this difficult to hear?

ABENA: I'm okay. I actually feel a bit better understanding why I feel anxious. Like it's not just me being crazy.

YAW: You are absolutely not crazy. Anxiety is one of the most common experiences among young people globally. In fact, the World Health Organization says that one in seven adolescents experience mental health conditions. You are not alone.

Let's talk about one more technique before we close: emotion labeling. Research by psychologist Matthew Lieberman found that when we put words to our emotions, it actually reduces the emotional charge in the brain. Just saying "I feel scared" out loud or writing it down reduces the intensity of that fear. It's called "affect labeling" and brain scans show it literally quiets the amygdala.

So the practice is simple but powerful: when you're feeling something intense, name it. Not "I'm anxious" but "I notice I'm feeling anxiety." The language of observer - I notice - creates a tiny distance that gives you power.

For this week, I want you to try an emotion log. Each day, write down three emotions you felt, when you felt them, what triggered them, and what you did in response. Not to judge yourself - just to become more aware. Awareness is the foundation of regulation.

Before we close, one last check-in. Kweku, you came in feeling calm. How are you now?

KWEKU: I actually learned a lot. I'm going to try the breathing thing next time my brothers annoy me. I think I'm a four - feeling pretty good.

YAW: Akosua - how are you?

AKOSUA: [pause] I still feel sad about my parents. But I feel like... I have some tools now? I feel a five.

YAW: That's growth. You can hold sadness and capability at the same time. Thank you all for being here today. Remember: your emotions are not your enemies. They're messengers. Learn to listen to them, work with them, and you'll find they have less power over you. See you next week.

[Session ends]
[Fellow notes: Strong session. Akosua disclosed family conflict - monitor for safeguarding concerns. She seemed stable and had support network. Will follow up next session. Group responded very well to physiological explanations of emotion.]
`

const FLAGGED_RISK_TRANSCRIPT = `
[Session Recording - Group Therapy Session]  
[Date: 2024-11-20, Duration: 55 minutes]
[Fellow: Efua Asante, Group ID: GRP-003-TAKORADI]

EFUA: Good afternoon everyone. Welcome to our session. Let's start with our usual check-in. Quick weather report for how you're feeling - stormy, cloudy, partly cloudy, sunny?

YAAKOB: Stormy.

EFUA: Thank you for telling us, Yaakob. Ama?

AMA: Sunny. Had a great day at school.

EFUA: Wonderful! Abena?

ABENA: Partly cloudy.

EFUA: And Mensah?

MENSAH: [long pause] I don't know. Can I say... like a hurricane?

EFUA: Of course you can. Thank you for being honest, Mensah. We'll come back to that. Today we're talking about building resilience. But first I want to check in with you, Mensah, before we start. You said hurricane - that sounds really difficult. Can you tell us a little more about how you're feeling?

MENSAH: I just... I've been having a really hard time. [pause] I don't know if things are ever going to get better.

EFUA: I hear you, Mensah. Can you tell me more about what's been happening?

MENSAH: My dad lost his job. And we might lose the house. And my older brother... he went away and I don't know when he's coming back. I just feel like everything is falling apart at once. And I've been thinking... I've been thinking that maybe it would be better if I wasn't here. Like, everyone would have one less problem to worry about.

EFUA: Mensah, thank you for trusting us with that. That took so much courage. I need to ask you directly - when you say it would be better if you weren't here, are you thinking about hurting yourself or ending your life?

MENSAH: I don't know. I've been thinking about it. Not like a plan or anything. But like... what's the point, you know? Who would even notice?

EFUA: We would notice. I would notice. Everyone in this room would notice. Mensah, I want you to know that what you're feeling - that level of pain - it's real, and it makes sense given everything you're going through. And I need you to know that we take what you said very seriously. You are important. Okay?

[Group session paused]

EFUA: I'm going to step aside briefly with Mensah after our session and I'm going to connect him with someone who can give him more support than what we have time for today. That's not a punishment - it's because you deserve the very best support available. Is that okay, Mensah?

MENSAH: [quietly] Okay.

EFUA: Good. Now, I want to be transparent with the group because we're a group and we support each other. Mensah has shared something very personal and very brave. Mental health struggles, even very dark thoughts, are more common than many of us realize. And reaching out - doing exactly what Mensah just did - is the most important step. Let's all take a moment and just be here with Mensah.

[Moment of silence]

EFUA: Before we continue with our session topic, does anyone else want to check in? Is anyone else having thoughts like Mensah shared?

YAAKOB: I... sometimes I feel like that too. Not as much as Mensah said, but like... pointless. Especially when my grades are bad.

EFUA: Yaakob, thank you. That also sounds really painful. I'm going to follow up with you too. These feelings of hopelessness - they're something we can address with the right support.

Now, I want to continue with our resilience session because I think some of what we cover today is directly relevant to what Mensah and Yaakob shared. And I want to be clear - resilience doesn't mean you don't feel pain. It doesn't mean you have to be strong all the time. Mensah showed incredible resilience just by speaking up today.

Resilience, as researchers like Dr. Ann Masten have defined it, is essentially the process of adapting well in the face of adversity, trauma, tragedy, threats, or significant sources of stress. And crucially - it's a process, not a trait. You're not born resilient or not resilient. Resilience is built, moment by moment, through the small acts of reaching out, asking for help, taking one step forward even when everything says to stop.

Mensah, what you did today - coming to group, checking in honestly, trusting us with something deeply painful - that is resilience. Even in the darkest moment.

ABENA: I had no idea Mensah was going through so much. I feel bad that I didn't notice.

EFUA: Abena, that's a tender and compassionate response. But I want to say - it's not your job to monitor others' mental health. That's why we have spaces like this one. But we can all be watchful, thoughtful friends who create space for honesty.

Let me teach you something called "protective factors" in resilience research. Studies show that the young people who fare best through adversity tend to have these things: strong relationships with caring adults, a sense of self-efficacy - belief that their actions matter, connection to community and belonging, and problem-solving skills.

Notice - the number one protective factor is relationships. Connection. Which is why what happened in this room today is so important. Mensah felt safe enough to share, and that safety came from the connections we've built.

AMA: What can we do as friends? Like if someone we know seems like they're really struggling?

EFUA: Such an important question. The research-backed answer is: ask. Directly. If you're worried about someone, ask them "are you okay? I've noticed you seem down lately. Are you having thoughts of hurting yourself?" Studies show that asking about suicide does not plant the idea - it creates an opening for someone to get help. Then listen without judgment. Stay with them. Help connect them to an adult who can help.

[Continuing session on resilience topics - 20 more minutes]

EFUA: Before we close, I want to do something different today. I want everyone to write down the name of one person in their life outside this group who they could reach out to if they were struggling. A parent, aunt, uncle, teacher, community leader, pastor. Someone. Write it down.

[Group writes]

EFUA: Now, Mensah, I'm going to ask you something. Do you have someone on your list?

MENSAH: My aunt. She's always been kind to me.

EFUA: I want you to text her tonight, okay? Just check in. You don't have to share everything. Just stay connected.

Now, I'm going to keep my promise and check in with Mensah and Yaakob after this session. For everyone else - you showed up today, you listened, you supported each other. That's resilience in community. See you next week.

[Session continues with individual follow-up]
[Fellow notes: CRITICAL - Mensah disclosed passive suicidal ideation (no plan, no means identified, but significant hopelessness and sense of being a burden). Immediate action taken: connected Mensah with Tier 2 Supervisor Dr. Owusu after session. Also follow-up with Yaakob re: passive hopelessness. Both consented to follow-up. Supervisor notified same day. Safeguarding report filed. Both youth have been referred to clinical support.]
`

const HEALTHY_RELATIONSHIPS_TRANSCRIPT = `
[Session Recording - Group Therapy Session]
[Date: 2024-11-22, Duration: 50 minutes]
[Fellow: Kwame Darko, Group ID: GRP-004-ACCRA]

KWAME_F: Good afternoon everyone! Great to have everyone here today. We have something really important to discuss - healthy relationships. Before we dive in, let's check in. Quick number from one to five?

PRIYA: Four! I'm happy today.

KOJO: Three. Just regular.

NAOMI: Two. Broke up with my boyfriend yesterday.

KWAME_F: Naomi, first - I'm sorry to hear that. That can be really hard. And actually, it's quite relevant to what we're talking about today. Would you be comfortable if some of our discussion touched on what you're going through?

NAOMI: Yeah, that's okay.

KWAME_F: Today we're going to explore what makes relationships healthy or unhealthy - and this applies to all kinds of relationships: romantic, friendships, family. This is an area where I think many of us didn't get great education, so I'm excited to share what research tells us.

Let's start with a question: what makes a relationship healthy? Just shout out words.

GROUP: [Various responses] Trust. Respect. Communication. Honesty. Support. Kindness.

KWAME_F: All excellent! Now what makes a relationship unhealthy?

GROUP: [Various responses] Lying. Controlling. Jealousy. Disrespect. Not listening.

KWAME_F: You all already know more than you think! Let me introduce you to Dr. John Gottman. He's one of the world's leading relationship researchers, and he spent decades studying couples to understand what makes relationships work or fail. He identified what he calls the "Four Horsemen" - four communication patterns that predict relationship breakdown with over 90% accuracy.

The four horsemen are: Criticism, Contempt, Defensiveness, and Stonewalling.

Criticism is attacking someone's character rather than addressing a behavior. Instead of "you left your dishes again" - criticism is "you're so lazy and inconsiderate."

Contempt is even more damaging - it's treating someone as inferior. Eye-rolling, mocking, sarcasm meant to demean.

Defensiveness is refusing to take responsibility, always playing the victim.

Stonewalling is shutting down completely, giving the silent treatment.

The antidotes - and this is important - are gentle start-up instead of criticism. Taking responsibility instead of defensiveness. Physiological self-soothing - taking a break when flooded. And expressing appreciation and respect instead of contempt.

NAOMI: [quietly] My boyfriend - ex-boyfriend - used to do a lot of contempt. Like when I said I was upset about something, he'd roll his eyes and say I was being dramatic.

KWAME_F: Thank you for sharing that, Naomi. That takes courage. What you described is a classic contempt behavior, and it's one of the most damaging because it communicates disrespect. How did that make you feel?

NAOMI: Like my feelings weren't valid. Like I was too much.

KWAME_F: Your feelings are always valid. They're yours. And you are not "too much" - you deserve a partner who holds space for your emotions. Let's talk about what healthy relationship communication looks like using Gottman's antidotes.

Instead of "you never listen to me" - a gentle start-up sounds like "I feel unheard when you're on your phone while I'm talking. Could we have a phone-free hour?"

PRIYA: That's so different. Like the first one makes you want to defend yourself but the second one makes you want to actually help.

KWAME_F: Exactly! That's why language matters so much in relationships. The first one attacks the person - "you never." The second uses an I-statement and makes a specific request. I feel... when... I need/I'd like...

Let me teach you the I-statement formula. It's one of the most practical relationship tools I know.

I feel [emotion] when [specific behavior] because [impact]. I would like/need [specific request].

KOJO: That sounds robotic though. Like who actually talks like that?

KWAME_F: Ha! Great pushback, Kojo. You're right that it sounds formulaic at first. But the structure teaches us to distinguish between our feelings and the other person's behavior, to take ownership of our emotional experience, and to make clear requests. Over time it becomes natural. Want to try practicing? I'll give you a scenario.

Scenario: Your friend borrowed your phone charger three times and keeps forgetting to return it. You're frustrated. How would you normally address it?

KOJO: I'd probably just be annoyed and passive aggressive. Maybe not lend it again.

KWAME_F: Classic avoidance strategy! Now try the I-statement.

KOJO: Okay... I feel... frustrated... when you borrow my charger and don't return it... because I never have it when I need it. I'd like you to please return it same day or buy your own?

[Group laughs warmly]

KWAME_F: That was fantastic! How did it feel?

KOJO: Weird. But actually less angry? Like saying it out loud made it seem more manageable.

KWAME_F: There's actually science behind that. Verbalizing helps us process. Now let's talk about boundaries - because this is crucial and often misunderstood.

Boundaries are not walls. They're not about keeping people out. They're about communicating what you need to feel safe, respected, and okay in a relationship. A boundary sounds like "I'm not comfortable when you..." or "I need..." or "It doesn't work for me when..."

And - this is important - setting a boundary is an act of love. It's being honest about what you can offer and what you need. Relationships where people don't set boundaries often breed resentment.

NAOMI: I never set boundaries in my relationship. I just went along with things to keep the peace.

KWAME_F: That pattern is called "fawning" - it's actually a trauma response. We'll sometimes abandon our own needs to keep others comfortable or to avoid conflict. It feels safe in the moment but it erodes self-respect over time.

What's one boundary you wish you had set?

NAOMI: [thinking] I wish I had said... when you dismiss my feelings, I need you to acknowledge them or I can't continue this conversation.

KWAME_F: That is a beautifully formed boundary. How does it feel to say it now?

NAOMI: Powerful. I didn't know I could say something like that.

KWAME_F: You always could. Now let's talk about something called "green flags" and "red flags" in relationships. Red flags - things that should raise concern. Green flags - things that indicate health.

Red flags: Someone who isolates you from friends and family. Someone who needs to know where you are constantly. Jealousy framed as love ("I'm jealous because I love you so much"). Dismissing your feelings or making you feel crazy for having them - this is called gaslighting. Moving very fast, intense idealization early on.

Green flags: Your partner encourages your independence. You feel safe to disagree. They apologize when they're wrong. They respect when you say no. They don't need you to account for every moment. You feel like yourself around them - not a performance.

[Extensive group discussion, 15 minutes]

KWAME_F: As we close, I want to check in with Naomi again. How are you feeling now?

NAOMI: Honestly? Better. Like I broke up with him because something felt off, and now I have language for what that was. I wasn't crazy.

KWAME_F: You were never crazy. You were listening to yourself, which is one of the most important skills you can develop.

For homework this week, I want you to notice your relationships. For each important relationship in your life, ask: Do I feel respected in this relationship? Am I able to be myself? When I set a limit, is it honored? Am I in this relationship out of joy or out of fear?

Thank you all for such an open and honest session today. I'm proud of all of you. See you next week.

[Session ends]
`

const SELF_COMPASSION_TRANSCRIPT = `
[Session Recording - Group Therapy Session]
[Date: 2024-11-25, Duration: 47 minutes]
[Fellow: Adwoa Sarkodie, Group ID: GRP-005-KUMASI]

ADWOA_F: Good morning beautiful people! Welcome to Monday's session. I'm really looking forward to today's topic - self-compassion. But first, quick check-in. What's one word for how you're feeling?

KWABENA: Tired.

ADWOA_F: Thank you, Kwabena. Fatigue is worth noting. Serena?

SERENA: Hopeful.

ADWOA_F: I love that. Kofi?

KOFI: Kind of sad. My grandmother is sick.

ADWOA_F: Oh Kofi, I'm so sorry. That's really hard. We hold that with you today.

[Session continues with introduction to self-compassion by Dr. Kristin Neff's research]

ADWOA_F: Self-compassion is made of three components. First, self-kindness - treating yourself with the warmth and understanding you'd offer a good friend, rather than harsh self-criticism. Second, common humanity - recognizing that suffering and imperfection are part of the shared human experience. You are not alone in your struggles. And third, mindfulness - holding painful thoughts and feelings in balanced awareness, neither ignoring nor over-identifying with them.

The research is remarkable. Studies show that people with high self-compassion have better mental health outcomes than those with high self-esteem. Why? Because self-esteem is contingent - it depends on succeeding. Self-compassion is unconditional.

[45-minute rich session continues with self-compassion exercises, loving-kindness meditation, discussion of inner critic, research on perfectionism and its costs, practical self-care planning, group sharing, meaningful engagement with Kofi's grief about grandmother, strong group dynamics, ending ritual of group appreciation...]

ADWOA_F: For homework, I want you to write a letter to yourself from the perspective of a compassionate friend - someone who knows all your struggles and failures and loves you completely. What would they say to you? See you Thursday!

[Session ends]
[Fellow notes: Good session. Kofi's disclosure re grandmother - he has family support, not showing acute distress. Monitor. Group responded positively to mindfulness exercise. Would benefit from more time on the common humanity component next time.]
`

async function seed() {
  console.log('🌱 Starting database seed...')

  // Check if already seeded
  const existingSupervisors = await db.select().from(supervisors).limit(1)
  if (existingSupervisors.length > 0) {
    console.log('✅ Database already seeded. Skipping...')
    return
  }

  // ── Supervisors ──────────────────────────────────────────────────────────────
  const [supervisor] = await db.insert(supervisors).values({
    name: 'Dr. Ama Owusu',
    email: 'supervisor@copilot.demo',
    passwordHash: '$2b$10$K7L.gR8vX2mN3pQ1sT4uOuYxWzA8bC6dE9fH2iJ5kL0mN3oP6qR9s', // demo123
    tier: 2,
    organization: 'Ghana Youth Mental Health Initiative',
  }).returning()

  console.log('✅ Created supervisor:', supervisor.name)

  // ── Fellows ──────────────────────────────────────────────────────────────────
  const fellowsData = [
    { name: 'Amara Osei', email: 'amara.osei@fellows.demo', age: 21, cohort: '2024-A', groupIds: ['GRP-001-ACCRA', 'GRP-006-ACCRA'] },
    { name: 'Yaw Mensah', email: 'yaw.mensah@fellows.demo', age: 20, cohort: '2024-A', groupIds: ['GRP-002-KUMASI'] },
    { name: 'Efua Asante', email: 'efua.asante@fellows.demo', age: 22, cohort: '2024-B', groupIds: ['GRP-003-TAKORADI'] },
    { name: 'Kwame Darko', email: 'kwame.darko@fellows.demo', age: 19, cohort: '2024-B', groupIds: ['GRP-004-ACCRA'] },
    { name: 'Adwoa Sarkodie', email: 'adwoa.sarkodie@fellows.demo', age: 21, cohort: '2024-A', groupIds: ['GRP-005-KUMASI'] },
  ]

  const insertedFellows = await db.insert(fellows).values(
    fellowsData.map(f => ({ ...f, supervisorId: supervisor.id, groupIds: f.groupIds }))
  ).returning()

  console.log('✅ Created', insertedFellows.length, 'fellows')

  // ── Sessions ─────────────────────────────────────────────────────────────────
  const concepts = [
    'Growth Mindset', 'Emotional Regulation', 'Resilience Building',
    'Healthy Relationships', 'Self-Compassion', 'Communication Skills',
    'Goal Setting', 'Stress Management', 'Social Skills', 'Problem Solving'
  ]

  const statuses = ['processed', 'flagged_for_review', 'safe', 'risk', 'pending', 'processing']

  const transcripts = [
    GROWTH_MINDSET_TRANSCRIPT,
    EMOTIONAL_REGULATION_TRANSCRIPT,
    FLAGGED_RISK_TRANSCRIPT,
    HEALTHY_RELATIONSHIPS_TRANSCRIPT,
    SELF_COMPASSION_TRANSCRIPT,
  ]

  const sessionsData = [
    // Session 1 - Amara, Growth Mindset, Processed Safe
    {
      fellowId: insertedFellows[0].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-001-ACCRA',
      sessionDate: new Date('2024-11-15T14:00:00'),
      durationMinutes: 52,
      assignedConcept: 'Growth Mindset',
      transcript: GROWTH_MINDSET_TRANSCRIPT,
      transcriptWordCount: GROWTH_MINDSET_TRANSCRIPT.split(' ').length,
      status: 'safe' as const,
    },
    // Session 2 - Yaw, Emotional Regulation, Processed Safe
    {
      fellowId: insertedFellows[1].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-002-KUMASI',
      sessionDate: new Date('2024-11-18T10:00:00'),
      durationMinutes: 58,
      assignedConcept: 'Emotional Regulation',
      transcript: EMOTIONAL_REGULATION_TRANSCRIPT,
      transcriptWordCount: EMOTIONAL_REGULATION_TRANSCRIPT.split(' ').length,
      status: 'processed' as const,
    },
    // Session 3 - Efua, Resilience - FLAGGED (suicidal ideation disclosed)
    {
      fellowId: insertedFellows[2].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-003-TAKORADI',
      sessionDate: new Date('2024-11-20T14:00:00'),
      durationMinutes: 55,
      assignedConcept: 'Resilience Building',
      transcript: FLAGGED_RISK_TRANSCRIPT,
      transcriptWordCount: FLAGGED_RISK_TRANSCRIPT.split(' ').length,
      status: 'risk' as const,
    },
    // Session 4 - Kwame, Healthy Relationships
    {
      fellowId: insertedFellows[3].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-004-ACCRA',
      sessionDate: new Date('2024-11-22T16:00:00'),
      durationMinutes: 50,
      assignedConcept: 'Healthy Relationships',
      transcript: HEALTHY_RELATIONSHIPS_TRANSCRIPT,
      transcriptWordCount: HEALTHY_RELATIONSHIPS_TRANSCRIPT.split(' ').length,
      status: 'safe' as const,
    },
    // Session 5 - Adwoa, Self-Compassion
    {
      fellowId: insertedFellows[4].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-005-KUMASI',
      sessionDate: new Date('2024-11-25T09:00:00'),
      durationMinutes: 47,
      assignedConcept: 'Self-Compassion',
      transcript: SELF_COMPASSION_TRANSCRIPT,
      transcriptWordCount: SELF_COMPASSION_TRANSCRIPT.split(' ').length,
      status: 'processed' as const,
    },
    // Sessions 6-10 - Pending/Processing sessions
    {
      fellowId: insertedFellows[0].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-006-ACCRA',
      sessionDate: new Date('2024-11-28T14:00:00'),
      durationMinutes: 60,
      assignedConcept: 'Communication Skills',
      transcript: `[Session Recording - Communication Skills]\n[Fellow: Amara Osei]\n\nAMARA: Today we explore active listening and assertive communication. Active listening means fully concentrating, understanding, responding, and remembering what is being said. It's different from passive hearing. Let me demonstrate... [extensive 60-minute session on communication skills, assertiveness vs aggression vs passivity, non-verbal communication, the impact of tone and body language, practical role-play exercises, group discussion on cultural communication norms, conflict resolution strategies, practicing difficult conversations, feedback on communication styles, closing ritual]`,
      transcriptWordCount: 900,
      status: 'pending' as const,
    },
    {
      fellowId: insertedFellows[1].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-007-KUMASI',
      sessionDate: new Date('2024-11-28T10:00:00'),
      durationMinutes: 60,
      assignedConcept: 'Goal Setting',
      transcript: `[Session Recording - Goal Setting]\n[Fellow: Yaw Mensah]\n\nYAW: Welcome everyone to our goal setting session. Today we're going to learn about SMART goals and the psychology of motivation. SMART stands for Specific, Measurable, Achievable, Relevant, and Time-bound. [60-minute session covering intrinsic vs extrinsic motivation, self-determination theory, obstacle mapping, implementation intentions, accountability partnerships, visualization techniques, discussion of cultural factors in goal-setting for African youth, connecting personal goals to community contribution, creating 30-60-90 day plans]`,
      transcriptWordCount: 850,
      status: 'processing' as const,
    },
    {
      fellowId: insertedFellows[2].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-008-TAKORADI',
      sessionDate: new Date('2024-11-29T14:00:00'),
      durationMinutes: 60,
      assignedConcept: 'Stress Management',
      transcript: `[Session Recording - Stress Management]\n[Fellow: Efua Asante]\n\nEFUA: Good afternoon. Today we're discussing stress management. The stress response was designed for short-term threats - not for ongoing academic pressure, family concerns, financial uncertainty. [Comprehensive 60-minute session on physiological stress response, cortisol and its effects, acute vs chronic stress, the role of lifestyle factors including sleep, nutrition and exercise, cognitive reframing techniques, progressive muscle relaxation, journaling as stress management, social support as buffer, environmental stressors and control, building stress tolerance, identifying early warning signs]`,
      transcriptWordCount: 780,
      status: 'flagged_for_review' as const,
    },
    {
      fellowId: insertedFellows[3].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-009-ACCRA',
      sessionDate: new Date('2024-11-29T16:00:00'),
      durationMinutes: 60,
      assignedConcept: 'Social Skills',
      transcript: `[Session Recording - Social Skills]\n[Fellow: Kwame Darko]\n\nKWAME: Welcome everyone. Social skills - or what psychologists call social competence - are learnable skills that significantly impact our wellbeing, relationships, and even career outcomes. [60-minute session covering components of social intelligence, reading social cues, initiating and maintaining conversations, navigating group dynamics, managing social anxiety, cultural humility, inclusion and exclusion dynamics, peer pressure and influence, practicing social skills through structured activities, discussing loneliness epidemic among young people, building genuine vs superficial connections]`,
      transcriptWordCount: 820,
      status: 'processed' as const,
    },
    {
      fellowId: insertedFellows[4].id,
      supervisorId: supervisor.id,
      groupId: 'GRP-010-KUMASI',
      sessionDate: new Date('2024-11-30T09:00:00'),
      durationMinutes: 60,
      assignedConcept: 'Problem Solving',
      transcript: `[Session Recording - Problem Solving]\n[Fellow: Adwoa Sarkodie]\n\nADWOA: Good morning! Problem solving is one of the most fundamental skills we can develop. Today we'll learn a structured approach to solving problems that you can apply to everything from personal challenges to school to work. [60-minute session covering the 6-step problem solving model, distinguishing problems from situations, brainstorming techniques, evaluating solutions with pros/cons, decision matrices, implementation planning, dealing with unsuccessful solutions, problem solving in groups vs individually, common cognitive biases that impair problem solving, building confidence through small wins, applying problem solving to real challenges group members are facing]`,
      transcriptWordCount: 800,
      status: 'pending' as const,
    },
  ]

  await db.insert(sessions).values(sessionsData)
  console.log('✅ Created', sessionsData.length, 'sessions')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Login credentials:')
  console.log('  Email: supervisor@copilot.demo')
  console.log('  Password: demo123')
}

seed().catch(console.error).finally(() => process.exit(0))
