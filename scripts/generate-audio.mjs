import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice — Clear, Engaging Educator (premade, free tier)
const MODEL_ID = 'eleven_turbo_v2_5';
const OUT_DIR = join(__dirname, '..', 'public', 'audio');

const twisters = [
  { id: 'b1-01', text: 'Three thin thinkers think.' },
  { id: 'b1-02', text: 'This is that there.' },
  { id: 'b1-03', text: 'Vera wore a very warm vest.' },
  { id: 'b1-04', text: 'Pat put the bat in the box.' },
  { id: 'b1-05', text: 'Six sheep sit on the ship.' },
  { id: 'b1-06', text: 'The cat has a black hat.' },
  { id: 'b1-07', text: 'Spot can speak in spring.' },
  { id: 'b1-08', text: 'Stan can stop and stand still.' },
  { id: 'b1-09', text: 'Skip can see the sky.' },
  { id: 'b1-10', text: 'Sam slept on the slow slide.' },
  { id: 'b1-11', text: 'Strong Stan ran down the street.' },
  { id: 'b1-12', text: 'Pass the tests and the lists.' },
  { id: 'b1-13', text: 'Two months passed by fast.' },
  { id: 'b1-14', text: 'Red rabbits run around.' },
  { id: 'b1-15', text: 'The girl read in the library.' },
  { id: 'b1-16', text: 'Harry has a high hill.' },
  { id: 'b1-17', text: 'Sing a song this morning.' },
  { id: 'b1-18', text: 'The large jet jumps high.' },
  { id: 'b1-19', text: 'A banana is about to fall.' },
  { id: 'b1-20', text: 'The bird heard a word.' },
  { id: 'b2-01', text: 'Thirty thirsty thieves thank Beth.' },
  { id: 'b2-02', text: 'Mother gathers feathers together.' },
  { id: 'b2-03', text: 'We watched Victor wave a violet van.' },
  { id: 'b2-04', text: 'Big Ben packed a basket of pears.' },
  { id: 'b2-05', text: "Tim's little kitten sleeps near the green tree." },
  { id: 'b2-06', text: 'Sam packed a bag and a fat map.' },
  { id: 'b2-07', text: 'Sam spent space on a spotted spoon.' },
  { id: 'b2-08', text: 'Steve studies at the small stone store.' },
  { id: 'b2-09', text: "Scott's school skirts the wide sky." },
  { id: 'b2-10', text: 'Sally slid slowly down the slippery slope.' },
  { id: 'b2-11', text: 'Spring brought strong streams to the street.' },
  { id: 'b2-12', text: 'The masks rest on the desks and chests.' },
  { id: 'b2-13', text: 'The strengths and lengths matched well.' },
  { id: 'b2-14', text: "Rita's river runs really far." },
  { id: 'b2-15', text: "Carl's world traveled around really far." },
  { id: 'b2-16', text: "Helen's horse hurried home happily." },
  { id: 'b2-17', text: 'The ring and the song belong together.' },
  { id: 'b2-18', text: 'Jenny enjoys a usual jelly jar.' },
  { id: 'b2-19', text: 'Around the sofa, a camera waited.' },
  { id: 'b2-20', text: 'Her purple shirt got dirty early.' },
  { id: 'b3-01', text: "Theo thinks Thursday's thunder is the worst thing." },
  { id: 'b3-02', text: "These brothers bathe their father's other feathers." },
  { id: 'b3-03', text: "Victor's van swerved away from the wet village well." },
  { id: 'b3-04', text: "Bobby's puppy buried a pebble by the pond." },
  { id: 'b3-05', text: 'Did the thin fish swim deep beneath the steep cliff?' },
  { id: 'b3-06', text: "Nat's black cat sat flat on the bath mat." },
  { id: 'b3-07', text: 'Spencer spoke quickly about the spinning spider.' },
  { id: 'b3-08', text: 'Stella stayed still beside the steady stream.' },
  { id: 'b3-09', text: "Skye skipped past the school's skinny skating rink." },
  { id: 'b3-10', text: 'Paul packed a plate of plump purple plums.' },
  { id: 'b3-11', text: 'Frank found four fresh figs for his friend.' },
  { id: 'b3-12', text: 'Penny picked a pink pepper from the pile.' },
  { id: 'b3-13', text: 'Five fluffy puffins fly far from the cliff.' },
  { id: 'b3-14', text: 'Pretty Pamela planted plenty of purple plants.' },
  { id: 'b3-15', text: 'Faithful Felix often finds funny photographs.' },
  { id: 'b3-16', text: "Peter's puppy plays with a purple ball happily." },
  { id: 'b3-17', text: 'Four friendly foxes found a few fresh fish.' },
  { id: 'b3-18', text: "Polly's parrot prefers popcorn to peanuts." },
  { id: 'b3-19', text: 'Fifty fearless fans followed the famous footballer.' },
  { id: 'b3-20', text: 'Five purple puffins flew past four pink flowers.' },
];

async function generateOne(id, text, index) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      output_format: 'mp3_44100_128',
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`[${id}] HTTP ${res.status}: ${msg}`);
  }

  const buf = await res.arrayBuffer();
  writeFileSync(join(OUT_DIR, `${id}.mp3`), Buffer.from(buf));
  console.log(`[${String(index + 1).padStart(2, '0')}/60] ✓ ${id}`);
}

async function main() {
  if (!API_KEY) { console.error('Set ELEVENLABS_API_KEY'); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  console.log('Generating 60 audio files with ElevenLabs (Rachel voice)…\n');
  for (let i = 0; i < twisters.length; i++) {
    const { id, text } = twisters[i];
    await generateOne(id, text, i);
    if (i < twisters.length - 1) await new Promise(r => setTimeout(r, 400));
  }
  console.log('\nDone! All files saved to public/audio/');
}

main().catch(e => { console.error(e.message); process.exit(1); });
