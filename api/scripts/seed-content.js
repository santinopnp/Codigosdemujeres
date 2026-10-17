"use strict";

/**
 * seed-content.js
 * Seeds blog posts and testimonials for launch.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { query, pool } = require("../db");

const POSTS = [
  {
    slug: "5-senales-de-que-necesitas-reconectar-contigo",
    title_es: "5 señales de que necesitas reconectar contigo misma",
    title_en: "5 signs you need to reconnect with yourself",
    excerpt_es: "A veces la vida nos desconecta de nuestra esencia. Descubre las señales y cómo volver a ti.",
    excerpt_en: "Sometimes life disconnects us from our essence. Discover the signs and how to return to yourself.",
    body_es: `<p>Hay momentos en los que la vida avanza tan rápido que dejamos de escucharnos. Nos perdemos en las rutinas, en las expectativas de los demás y en el ruido constante. Pero tu cuerpo y tu energía siempre te dan señales.</p>
<h2>1. Te sientes vacía aunque "todo está bien"</h2>
<p>Tienes trabajo, relaciones, actividades… pero algo falta. Esa sensación de vacío no es ingratitud, es tu alma pidiéndote que vuelvas a conectar con lo que realmente importa: tú.</p>
<h2>2. Dices "sí" cuando quieres decir "no"</h2>
<p>Cuando priorizas constantemente a los demás sobre ti misma, tu energía se drena. Cada "sí" que no sientes se convierte en una pequeña traición a tu autenticidad.</p>
<h2>3. Has dejado de hacer lo que te apasiona</h2>
<p>¿Cuándo fue la última vez que bailaste, escribiste, pintaste o simplemente hiciste algo solo por placer? Si no recuerdas, es momento de reencontrarte.</p>
<h2>4. Te comparas constantemente con otras mujeres</h2>
<p>La comparación es la señal más clara de desconexión. Cuando estás alineada contigo, celebras a las demás sin sentir que pierdes algo.</p>
<h2>5. Tu diálogo interno es cruel</h2>
<p>Si la voz en tu cabeza te dice que no eres suficiente, que no mereces, que no puedes… esa no eres tú. Es el resultado de años de programación que hoy puedes empezar a cambiar.</p>
<h2>¿Qué hacer?</h2>
<p>En <em>Códigos que toda mujer necesita saber</em>, exploramos cómo reconectar con tu esencia femenina, transformar tu diálogo interno y construir una vida alineada con quien realmente eres.</p>`,
    body_en: `<p>There are moments when life moves so fast that we stop listening to ourselves. We get lost in routines, in others' expectations, and in the constant noise. But your body and energy always give you signs.</p>
<h2>1. You feel empty even though "everything is fine"</h2>
<p>You have work, relationships, activities... but something is missing. That feeling of emptiness isn't ingratitude — it's your soul asking you to reconnect with what truly matters: you.</p>
<h2>2. You say "yes" when you want to say "no"</h2>
<p>When you constantly prioritize others over yourself, your energy drains. Every "yes" you don't feel becomes a small betrayal of your authenticity.</p>
<h2>3. You've stopped doing what you're passionate about</h2>
<p>When was the last time you danced, wrote, painted, or simply did something just for pleasure? If you can't remember, it's time to reconnect.</p>
<h2>4. You constantly compare yourself to other women</h2>
<p>Comparison is the clearest sign of disconnection. When you're aligned with yourself, you celebrate others without feeling like you're losing something.</p>
<h2>5. Your inner dialogue is cruel</h2>
<p>If the voice in your head tells you that you're not enough, that you don't deserve, that you can't... that's not you. It's the result of years of programming that you can start changing today.</p>
<h2>What to do?</h2>
<p>In <em>Codes That Every Woman Should Know</em>, we explore how to reconnect with your feminine essence, transform your inner dialogue, and build a life aligned with who you truly are.</p>`,
    read_min: 4,
    post_type: "article",
    content_type: "blog",
  },
  {
    slug: "el-poder-del-silencio-femenino",
    title_es: "El poder del silencio femenino: por qué no necesitas explicarte",
    title_en: "The power of feminine silence: why you don't need to explain yourself",
    excerpt_es: "El misterio no es distancia, es profundidad. Descubre por qué el silencio es tu herramienta más poderosa.",
    excerpt_en: "Mystery isn't distance — it's depth. Discover why silence is your most powerful tool.",
    body_es: `<p>En un mundo que nos pide estar constantemente visibles, hablar, publicar y explicar cada decisión, hay un poder inmenso en lo contrario: el silencio.</p>
<p>No hablo de callarte por miedo o sumisión. Hablo de ese silencio consciente que elige no responder cuando no es necesario, que no justifica cada paso, que deja espacio para que los demás descubran quién eres en lugar de contárselo todo.</p>
<h2>El silencio comunica más que las palabras</h2>
<p>Una mujer que no llena cada espacio con palabras innecesarias genera una presencia que intriga. Su calma despierta curiosidad, su pausa invita a prestar atención.</p>
<h2>No necesitas convencer a nadie</h2>
<p>Cuando una mujer confía en sí misma, no siente la urgencia de explicarse. No necesita convencer a nadie de su valor porque ya lo sabe. Y eso se siente.</p>
<h2>El arte de la pausa</h2>
<p>Antes de responder, respira. Antes de reaccionar, observa. Antes de hablar, pregúntate: ¿esto necesita ser dicho, o estoy llenando un vacío por incomodidad?</p>
<p>El silencio bien manejado es una de las herramientas más poderosas de liderazgo personal. En <em>Códigos</em>, dedicamos un capítulo entero a desarrollar esta habilidad que transforma relaciones, tu presencia y tu energía.</p>`,
    body_en: `<p>In a world that asks us to be constantly visible, to talk, post, and explain every decision, there's immense power in the opposite: silence.</p>
<p>I'm not talking about being quiet out of fear or submission. I'm talking about that conscious silence that chooses not to respond when it's not necessary, that doesn't justify every step, that leaves space for others to discover who you are instead of telling them everything.</p>
<h2>Silence communicates more than words</h2>
<p>A woman who doesn't fill every space with unnecessary words creates a presence that intrigues. Her calm awakens curiosity, her pause invites attention.</p>
<h2>You don't need to convince anyone</h2>
<p>When a woman trusts herself, she doesn't feel the urgency to explain herself. She doesn't need to convince anyone of her worth because she already knows it. And that's felt.</p>
<h2>The art of the pause</h2>
<p>Before responding, breathe. Before reacting, observe. Before speaking, ask yourself: does this need to be said, or am I filling a void out of discomfort?</p>
<p>Well-managed silence is one of the most powerful tools of personal leadership. In <em>Codes</em>, we dedicate an entire chapter to developing this skill that transforms relationships, your presence, and your energy.</p>`,
    read_min: 3,
    post_type: "article",
    content_type: "blog",
  },
  {
    slug: "checklist-matutino-para-activar-tu-energia",
    title_es: "Checklist matutino para activar tu energía femenina",
    title_en: "Morning checklist to activate your feminine energy",
    excerpt_es: "Un ritual simple pero poderoso para empezar cada día alineada contigo misma.",
    excerpt_en: "A simple but powerful ritual to start each day aligned with yourself.",
    body_es: `<p>La manera en que empiezas tu mañana define la energía de todo tu día. No necesitas horas de ritual — solo minutos de intención.</p>
<h2>Antes de levantarte</h2>
<ul>
<li>Respira profundo 3 veces llevando el aire al vientre</li>
<li>Agradece algo específico de tu vida</li>
<li>Visualiza cómo quieres sentirte hoy</li>
</ul>
<h2>Frente al espejo</h2>
<ul>
<li>Mírate a los ojos y di: "Soy suficiente"</li>
<li>Observa tu postura — hombros abiertos, espalda recta</li>
<li>Sonríe. No para nadie más, para ti</li>
</ul>
<h2>Tu imagen</h2>
<ul>
<li>Elige ropa que te haga sentir poderosa, no solo cómoda</li>
<li>Un aroma que te represente</li>
<li>Un detalle intencional: un accesorio, un color, algo que te recuerde quién eres</li>
</ul>
<h2>Tu intención</h2>
<ul>
<li>Define una palabra para tu día: calma, fuerza, presencia, amor</li>
<li>Pregúntate: ¿cómo actuaría hoy mi versión más poderosa?</li>
</ul>
<p>Este checklist está inspirado en el Capítulo 13 de <em>Códigos que toda mujer necesita saber</em>. El libro incluye la versión completa con más de 20 puntos para construir tu ritual diario.</p>`,
    body_en: `<p>The way you start your morning defines the energy of your entire day. You don't need hours of ritual — just minutes of intention.</p>
<h2>Before getting up</h2>
<ul>
<li>Take 3 deep breaths, bringing air to your belly</li>
<li>Be grateful for something specific in your life</li>
<li>Visualize how you want to feel today</li>
</ul>
<h2>In front of the mirror</h2>
<ul>
<li>Look into your eyes and say: "I am enough"</li>
<li>Check your posture — open shoulders, straight back</li>
<li>Smile. Not for anyone else, for yourself</li>
</ul>
<h2>Your image</h2>
<ul>
<li>Choose clothes that make you feel powerful, not just comfortable</li>
<li>A scent that represents you</li>
<li>An intentional detail: an accessory, a color, something that reminds you who you are</li>
</ul>
<h2>Your intention</h2>
<ul>
<li>Define one word for your day: calm, strength, presence, love</li>
<li>Ask yourself: how would my most powerful version act today?</li>
</ul>
<p>This checklist is inspired by Chapter 13 of <em>Codes That Every Woman Should Know</em>. The book includes the complete version with over 20 points to build your daily ritual.</p>`,
    read_min: 3,
    post_type: "article",
    content_type: "blog",
  },
];

const TESTIMONIALS = [
  {
    author: "Valentina R.",
    location: "Bogotá, Colombia",
    text_es: "Este libro me cambió la perspectiva por completo. Cada capítulo es como una conversación con una amiga que te dice exactamente lo que necesitas escuchar. Lo recomiendo con el alma.",
    text_en: "This book completely changed my perspective. Each chapter is like a conversation with a friend who tells you exactly what you need to hear. I recommend it with all my heart.",
    stars: 5, sort_order: 1,
  },
  {
    author: "María José L.",
    location: "CDMX, México",
    text_es: "Llegó a mi vida en el momento exacto. Me ayudó a reconectar con mi energía femenina y a poner límites que antes me daban miedo. El capítulo de liderazgo es oro puro.",
    text_en: "It came into my life at the exact right moment. It helped me reconnect with my feminine energy and set boundaries I was afraid of before. The leadership chapter is pure gold.",
    stars: 5, sort_order: 2,
  },
  {
    author: "Carolina M.",
    location: "Miami, USA",
    text_es: "Lo escuché en audiolibro mientras manejaba y terminé estacionada llorando de lo profundo que me tocó. Dayana escribe con una honestidad que se siente real, no como otros libros de autoayuda.",
    text_en: "I listened to the audiobook while driving and ended up parked, crying at how deeply it touched me. Dayana writes with an honesty that feels real, not like other self-help books.",
    stars: 5, sort_order: 3,
  },
  {
    author: "Ana Sofía P.",
    location: "Madrid, España",
    text_es: "El checklist diario se convirtió en mi ritual sagrado cada mañana. Desde que empecé, noto cómo cambió mi energía y cómo la gente me percibe diferente. Gracias, Dayana.",
    text_en: "The daily checklist became my sacred morning ritual. Since I started, I notice how my energy has changed and how people perceive me differently. Thank you, Dayana.",
    stars: 5, sort_order: 4,
  },
  {
    author: "Lucía G.",
    location: "Buenos Aires, Argentina",
    text_es: "Compré el bundle y no me arrepiento. El libro es hermoso y el audiolibro es perfecto para escuchar antes de dormir. Me siento más segura y más conectada conmigo misma desde que lo leí.",
    text_en: "I bought the bundle and I don't regret it. The book is beautiful and the audiobook is perfect to listen to before sleeping. I feel more confident and more connected with myself since I read it.",
    stars: 5, sort_order: 5,
  },
];

async function seed() {
  console.log("\nSeeding blog posts…\n");
  for (const p of POSTS) {
    await query(
      `INSERT INTO blog_posts (slug, title_es, title_en, excerpt_es, excerpt_en, body_es, body_en, read_min, post_type, content_type, published, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, true, NOW())
       ON CONFLICT (slug) DO UPDATE SET
         title_es=EXCLUDED.title_es, title_en=EXCLUDED.title_en,
         excerpt_es=EXCLUDED.excerpt_es, excerpt_en=EXCLUDED.excerpt_en,
         body_es=EXCLUDED.body_es, body_en=EXCLUDED.body_en,
         read_min=EXCLUDED.read_min, published=true, published_at=COALESCE(blog_posts.published_at, NOW())`,
      [p.slug, p.title_es, p.title_en, p.excerpt_es, p.excerpt_en, p.body_es, p.body_en, p.read_min, p.post_type, p.content_type]
    );
    console.log(`  ✓ ${p.slug}`);
  }

  console.log("\nSeeding testimonials…\n");
  for (const t of TESTIMONIALS) {
    await query(
      `INSERT INTO testimonials (author, location, text_es, text_en, stars, sort_order, active)
       VALUES ($1,$2,$3,$4,$5,$6, true)`,
      [t.author, t.location, t.text_es, t.text_en, t.stars, t.sort_order]
    );
    console.log(`  ✓ ${t.author}`);
  }

  console.log("\nDone! ✦\n");
  await pool.end();
}

seed().catch(err => { console.error("Failed:", err.message); process.exit(1); });
