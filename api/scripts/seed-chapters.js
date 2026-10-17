"use strict";

/**
 * seed-chapters.js
 * Populates book_chapters with the full Spanish text of
 * "Códigos que toda mujer necesita saber" by Dayana Guerrero.
 *
 * Run on the server (api/ directory):
 *   NODE_ENV=production DATABASE_URL=<url> node scripts/seed-chapters.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { query, pool } = require("../db");

/* ─── helpers ─────────────────────────────────────────────────── */
const p  = (t) => `<p>${t}</p>`;
const bq = (t) => `<blockquote>${t}</blockquote>`;
const em = (t) => `<em>${t}</em>`;
const ornament = `<div class="ornament">✦ ✦ ✦</div>`;
const affirmations = (...items) =>
  `<ul class="affirmations">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const checklist = (...items) =>
  `<ul class="checklist">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const question = (t) => `<p class="question">${em(t)}</p>`;

/* ─── chapters ────────────────────────────────────────────────── */
const CHAPTERS = [
  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 1 — Dedicatoria & Prólogo
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 1,
    titleEs: "Dedicatoria & Prólogo",
    bodyEs: [
      `<div class="dedicatoria">`,
      bq("A ti, que atravesaste sombras, silencios y heridas profundas, y aun así elegiste levantarte. Esta obra honra tu valentía, tu resiliencia y la luz que nunca dejaste apagar dentro de ti."),
      `</div>`,
      ornament,
      `<div class="author-photo"><img src="/daya.jpg" alt="Dayana Guerrero" /></div>`,
      p("Si alguna vez te has sentido desconectada de ti misma, si has dudado de tu valor o has cargado heridas en silencio; este libro es para ti."),
      p("Aquí no encontrarás fórmulas perfectas ni reglas que te digan quién debes ser. Encontrarás algo más poderoso: un espacio para volver a ti. Para recordar la mujer que eres cuando te eliges, cuando te escuchas y cuando decides reconstruirte desde el amor propio y la conciencia."),
      p("A lo largo de estas páginas, te guiaré con cercanía y honestidad por un camino de transformación donde la mente, la energía, la esencia y el liderazgo personal se entrelazan. Cada capítulo es una invitación a mirar hacia adentro, a sanar, a reconocer tu historia sin juicio y a convertirla en tu mayor fortaleza."),
      bq("Este no es solo un libro que se lee. Es un libro que se siente, se cuestiona y se vive."),
      p("Porque dentro de ti ya existe una mujer fuerte, magnética y llena de propósito y este es el momento de descubrirla."),
      ornament,
      `<div class="author-signature">— Dayana Guerrero</div>`,
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 2 — Reconociendo tu poder femenino
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 2,
    titleEs: "Reconociendo tu poder femenino",
    bodyEs: [
      p("En este primer capítulo, quiero invitarte a descubrir qué significa realmente tu energía femenina y cómo empezar a reconocer el poder que habita en ti."),
      p("Caminemos juntas mientras desmontamos los mitos y las creencias que, durante tanto tiempo, han limitado nuestra forma de ver la feminidad."),
      p("También encontrarás un ejercicio especial para identificar tus fortalezas internas, esas que te hacen única, valiosa y profundamente poderosa."),
      bq("Empoderarte es un acto de valentía, sobre todo cuando la vida te ha puesto a prueba."),
      p("Este capítulo está creado para que conectes contigo desde un lugar honesto, comprendiendo que tu poder no se define por lo que has sufrido, sino por la fuerza con la que eliges levantarte."),
      ornament,
      p("Ahora, quiero que te detengas un momento…"),
      p("Piensa en la mujer que más admiras en este instante. Visualízala."),
      question("¿Tiene la vida que sueñas?"),
      question("¿Su energía, su confianza, su forma de habitar el mundo?"),
      question("Y ahora pregúntate: ¿cómo llegó hasta ahí?"),
      p("La respuesta es más simple de lo que imaginas: aprendió a valorarse."),
      p("Toda mujer que hoy brilla —en lo personal, en lo profesional o en lo emocional— primero atravesó el proceso de reconocer su propio valor. Tomó una decisión firme: no aceptar menos de lo que merece. Trabaja por lo suyo. Se levanta cada día con intención. Y, sobre todo, no se detiene."),
      ornament,
      p("Ahora quiero hacerte una pregunta importante…"),
      p("¿Qué pasaría si te dijera que tú también puedes construir esa vida, pero para lograrlo necesitas soltar todo aquello que hoy te mantiene atada a una versión de ti que ya no te representa?"),
      p("Sí… por eso estás aquí."),
      p("Porque hay una parte de ti que está cansada de quedarse en el mismo lugar, en el mismo pensamiento, en el mismo ciclo."),
      p("Esa versión tuya que observa el techo en silencio, preguntándose hacia dónde ir."),
      bq("Déjame decirte algo con total honestidad: yo también estuve ahí. Y fue mi decisión —la profunda certeza de que merecía más— la que me impulsó a levantarme, a sacudirme el polvo y comenzar de nuevo."),
      ornament,
      p("Porque hay momentos en la vida en los que ya no basta con querer cambiar… hay que moverse."),
      p("Y sí, hay algo que necesitas entender con claridad: para avanzar, tendrás que renunciar."),
      p("Renunciar a lo que no te suma. A lo que apaga tu luz. A lo que no te da paz."),
      p("Aprender a poner límites, incluso cuando duele. Tomar distancia de aquello que drena tu energía, aunque venga disfrazado de costumbre o cercanía."),
      bq("Sé lo que estás pensando: &ldquo;No es tan fácil.&rdquo; Y tienes razón… no siempre lo parece."),
      p("Pero también es cierto que es más posible de lo que crees."),
      p("La vida está hecha de decisiones. Y si miras tu historia con honestidad, notarás algo poderoso: todo lo que has logrado hasta hoy comenzó con una decisión."),
      p("Ahora es momento de elegir de nuevo. Haz espacio para la mujer en la que te estás convirtiendo. Permítete soltar lo que ya no encaja contigo."),
      p("Porque crecer implica incomodidad… pero también libertad. No se trata de romperte, sino de reconstruirte desde un lugar más consciente, más alineado, más tuyo."),
      ornament,
      p("Entonces dime…"),
      question("¿Vas a seguir viviendo en piloto automático?"),
      question("¿O vas a levantarte y decir: &ldquo;hasta aquí&rdquo;?"),
      p("Amiga… lo que pasó, ya quedó atrás. Ahora lo único que importa es esto:"),
      bq("¿Qué vas a hacer con lo que eres hoy… y con todo lo que aún puedes llegar a ser?"),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 3 — Entendiendo tu energía femenina
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 3,
    titleEs: "Entendiendo tu energía femenina",
    bodyEs: [
      p("Quiero hablarte de esa parte de ti que nadie te enseñó a honrar."),
      p("Esa que te vuelve magnética, misteriosa, profundamente irresistible… no porque lo intentes, sino porque es tu esencia natural cuando dejas de bloquearla."),
      p("Estoy hablando de tu energía femenina."),
      p("Sí, esa que te permite fluir, sentir, crear, intuir y seducir sin esfuerzo. Esa que habita en ti incluso cuando el mundo te enseñó a esconderla."),
      bq("Tu energía femenina no necesita ser forzada ni aprendida desde cero; necesita ser recordada."),
      p("Es un susurro interno que te guía, una presencia suave pero poderosa que, cuando la reconoces, transforma la forma en que te ves y en que habitas el mundo."),
      ornament,
      p("Durante mucho tiempo nos hicieron creer que una mujer femenina era frágil o débil. Pero eso no es verdad."),
      bq("Tu energía femenina es poder silencioso."),
      p("Vivimos en un mundo que aplaude lo masculino: hacer, producir, controlar y competir. Y sí, esa energía también es necesaria. Pero lo femenino ha sido reprimido, juzgado e incluso ridiculizado."),
      p("Como si sentir profundamente fuera un defecto. Como si desear cuidado fuera necesidad. Como si disfrutar del placer fuera superficialidad."),
      p("Y entre nosotras, sabes que no es así. Todo eso son ideas heredadas que no te pertenecen y que hoy puedes empezar a soltar."),
      ornament,
      p("Tu energía femenina es la fuente de tu sensualidad, de tu magnetismo, de tu intuición y de ese fuego interno que no se explica, pero se siente."),
      p("Es lo que hace que entres a un lugar y, sin decir una sola palabra, tu presencia sea percibida. Está en tu mirada, en tu forma de escuchar, en la manera en que te mueves y te expresas."),
      p("No es algo que tengas que entrenar o fabricar. Es algo que vive en ti. Solo necesitas permitirte recordarlo, despertarlo y honrarlo con amor y respeto hacia ti misma."),
      bq("Porque cuando te reconectas con esa energía, todo en tu vida empieza a alinearse de una forma más natural y auténtica."),
      ornament,
      p("Existen muchos mitos que han limitado la manera en que percibes tu feminidad. Frases como &ldquo;ser femenina es ser débil&rdquo; o &ldquo;tener poder significa ser dura&rdquo; han marcado generaciones enteras."),
      p("Pero la verdad es otra: el equilibrio es la clave. Integrar tu energía femenina con tu energía masculina te convierte en una mujer completa, segura y profundamente atractiva."),
      p("Una mujer conectada con su energía femenina no necesita esforzarse para seducir, porque ella es la seducción. No necesita perseguir, porque su esencia atrae. No necesita alzar la voz para ser escuchada, porque su presencia ya tiene impacto."),
      p("No necesita complacer para ser aceptada, porque se siente suficiente siendo quien es. Todo esto no nace desde el ego, sino desde un lugar mucho más profundo."),
      p("Desde el recuerdo de su verdadera esencia. Desde la conexión con su autenticidad."),
      ornament,
      p("Ahora quiero invitarte a reflexionar con honestidad:"),
      question("¿Cómo has visto tu feminidad hasta este momento de tu vida?"),
      question("¿La has juzgado, escondido o limitado por miedo o creencias externas?"),
      question("¿Qué ideas sobre ti misma has sostenido sin cuestionarlas?"),
      p("Tal vez ha llegado el momento de soltarlas y permitirte redescubrirte desde un lugar más amoroso, consciente y verdadero."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 4 — Encuentra un propósito
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 4,
    titleEs: "Encuentra un propósito",
    bodyEs: [
      p("Encontrar un propósito en tu vida no es una exigencia, es un acto de amor propio."),
      p("Cuando no tienes claridad sobre quién quieres ser, qué deseas lograr o hacia dónde te diriges, es fácil sentir que avanzas sin sentido."),
      p("Por eso, regalarte el tiempo para descubrir tu propósito es una de las decisiones más importantes que puedes tomar. No se trata solo de tener una meta, sino de construir un camino que tenga significado para ti."),
      question("¿Cuánto estás dispuesta a dar? ¿Qué tan comprometida estás contigo misma?"),
      bq("Ser clara con lo que quieres transformará tu forma de vivir."),
      ornament,
      p("En este mundo existen dos tipos de personas: las que hablan de sus sueños y las que trabajan silenciosamente para cumplirlos."),
      p("La diferencia no está en lo que dicen, sino en lo que hacen cada día."),
      p("Imaginar un futuro bonito no es suficiente si no sabes cómo construirlo. Tu vida cambia cuando tus acciones empiezan a estar alineadas con tus palabras."),
      p("Cuando dejas de prometerte cosas y comienzas a demostrarte, con hechos, que realmente estás comprometida contigo y con aquello que deseas lograr."),
      ornament,
      p("Quiero que lo veas de una manera simple. Si una de tus metas es terminar tu educación, sabes que el camino implica disciplina, organización y constancia."),
      p("Entonces, empieza por estructurar tu tiempo con intención. Planifica tu semestre antes de comenzarlo, organiza horarios que puedas cumplir y crea hábitos que te acerquen a tu objetivo."),
      p("No se trata solo de llegar al final, sino de cómo decides recorrer el proceso. Cuando te comprometes contigo misma, el resultado no es solo cumplir una meta, sino hacerlo con excelencia y con una versión más fuerte de ti."),
      p("Empieza a planear tus días con amor y responsabilidad. Organiza tus comidas, tu entrenamiento, incluso lo que vas a usar."),
      p("Puede parecer algo pequeño, pero estos detalles liberan tu mente y te permiten enfocarte en lo verdaderamente importante."),
      bq("La disciplina tiene algo profundamente hermoso: te sostiene incluso cuando la motivación se desvanece."),
      p("Porque la motivación es pasajera, pero la rutina bien construida se convierte en un refugio que te impulsa a seguir avanzando, incluso en los días en los que no tienes ganas, en los días en los que todo pesa un poco más."),
      ornament,
      p("Muchas veces las personas permiten que su estado de ánimo decida por ellas. Si no se sienten bien, simplemente se detienen."),
      p("Pero la vida no se construye solo en los días fáciles. También se construye en aquellos momentos en los que decides avanzar, incluso cuando no tienes energía o motivación."),
      bq("Ahí es donde realmente se forja tu carácter."),
      p("Entiende esto con claridad: tengas o no ganas, hay cosas que debes hacer si quieres construir la vida que sueñas. No se trata de exigirte desde el castigo, sino desde el compromiso profundo contigo misma."),
      p("No pospongas lo que sabes que es importante. Tu compromiso contigo debe ser firme, casi sagrado."),
      p("Cada vez que dejas algo para después, le estás diciendo a tu mente que eso no tiene valor. Y poco a poco, tu energía empieza a dispersarse."),
      p("La constancia no nace de la perfección, nace de la decisión de intentarlo una y otra vez."),
      bq("No permitas que la comodidad momentánea tenga más fuerza que tus sueños. Tu voluntad es mucho más poderosa de lo que crees, y cuando decides honrarla, todo dentro de ti comienza a transformarse."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 5 — Reconocer tu fortaleza interna
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 5,
    titleEs: "Reconocer tu fortaleza interna",
    bodyEs: [
      p("A veces olvidas todo lo que has atravesado, todo lo que has superado y la fuerza que ha vivido dentro de ti en cada uno de esos momentos."),
      p("Por eso, hoy quiero invitarte a hacer una pausa consciente y mirar tu historia con otros ojos."),
      p("Permítete recordar aquellos momentos en los que, a pesar del miedo, del dolor o de la incertidumbre, encontraste la manera de seguir adelante."),
      bq("No fue casualidad. Hubo algo dentro de ti que te sostuvo, que no se rindió, que decidió continuar incluso cuando todo parecía difícil."),
      ornament,
      p("Ahora, con suavidad y honestidad, haz un pequeño inventario de esas experiencias."),
      p("Escribe o piensa en situaciones donde sentiste que la vida te puso a prueba, pero aun así lograste salir adelante."),
      p("Luego, identifica qué cualidades nacieron o se fortalecieron en ti durante esos momentos. Tal vez fue tu resiliencia, tu valentía, tu paciencia o tu intuición."),
      p("Esas cualidades no aparecieron por suerte, son parte de ti. Viven en tu esencia, aunque a veces las olvides."),
      bq("Reconocerlas es volver a casa, es reconectar con esa versión tuya que siempre ha sido capaz, incluso cuando tú dudabas."),
      ornament,
      p("Ahora quiero invitarte a ir un poco más profundo."),
      p("Cierra los ojos por un momento e imagina a esa versión de ti misma fuerte, segura y poderosa. Obsérvala con atención."),
      question("¿Cómo se mueve?"),
      question("¿Cómo se siente habitar su propio cuerpo?"),
      question("¿Qué energía transmite sin decir una sola palabra?"),
      p("Permite que esa imagen te hable, que te susurre lo que necesitas escuchar en este momento de tu vida."),
      p("Porque esa versión no está lejos de ti. No es alguien en quien debas convertirte, es alguien que ya eres, esperando ser reconocida, aceptada y vivida con más presencia y verdad."),
      ornament,
      p("Cuando hayas conectado con esa imagen, quiero que te respondas desde el cuerpo, no desde la mente. No pienses demasiado, solo siente."),
      question("¿Cuándo fue la última vez que hiciste algo simplemente por placer, sin sentir que debías cumplir con algo?"),
      question("¿Cuándo fue la última vez que escuchaste tu intuición sin necesidad de buscar explicaciones lógicas?"),
      question("¿Cuándo fue la última vez que recibiste algo —una mirada, un gesto, un regalo— sin sentir culpa o la obligación de devolverlo?"),
      p("Permítete ser honesta contigo. No hay respuestas correctas o incorrectas, solo verdades que necesitan ser vistas."),
      ornament,
      p("Tu energía femenina comienza a florecer en el momento en que dejas de exigirte tanto y empiezas a permitirte ser."),
      p("Cuando sueltas el control excesivo, cuando dejas de forzar cada resultado y empiezas a confiar en el ritmo natural de tu vida."),
      p("Hay una gran diferencia entre perseguir y permitir. Cuando corres detrás de todo, te desgastas."),
      bq("Pero cuando te alineas contigo misma, lo que es para ti encuentra la manera de llegar. No desde la lucha, sino desde la conexión. No desde la carencia, sino desde la plenitud que empieza a habitar dentro de ti cuando decides elegirte."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 6 — El poder de comprender tu historia
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 6,
    titleEs: "El poder de comprender tu historia",
    bodyEs: [
      p("Comprender tu historia es uno de los pasos más profundos que puedes dar en tu proceso de transformación."),
      p("Pero para lograrlo, primero necesitas dejar de romantizar tu zona de confort. No importa cuán familiar o cómoda se haya vuelto tu rutina; si en el fondo de tu corazón sientes que algo falta, es momento de escucharte con honestidad."),
      p("A veces te dices que &ldquo;no está tan mal&rdquo;, que &ldquo;todo pasa por algo&rdquo; o que &ldquo;ya vendrán tiempos mejores&rdquo;. Pero la verdad es que los cambios que deseas no llegan por sí solos."),
      bq("Nacen cuando decides dejar de conformarte y comienzas a elegirte."),
      ornament,
      p("Esa mujer que admiras no es diferente a ti. No tiene magia ni suerte especial. Tiene decisión, coraje y una autoestima que ha sido construida con intención."),
      p("Y tú también puedes desarrollar todo eso, pero primero necesitas dejar de traicionarte."),
      p("Cada vez que ignoras lo que sientes, cada vez que te quedas donde ya no eres feliz, te alejas un poco más de quien realmente eres."),
      p("Si quieres cambiar tu vida, tendrás que tomar decisiones incómodas. Tendrás que soltar, cerrar ciclos y despedirte de versiones de ti que ya cumplieron su propósito en tu historia."),
      ornament,
      p("La versión de ti que fuiste no puede acompañarte al siguiente nivel. Y eso no es algo triste, es parte natural de crecer."),
      bq("Permítete hacer ese duelo con amor. Agradécele a esa mujer por todo lo que hizo por ti, por cómo te protegió, por lo que te enseñó… y luego suéltala."),
      p("No necesitas cargarla contigo para siempre. La vida sigue avanzando, y tú también mereces hacerlo."),
      p("No te quedes esperando el momento perfecto, porque ese momento se construye con cada decisión que tomas hoy."),
      ornament,
      p("Sanar no significa olvidar lo que has vivido, sino aprender a integrarlo sin que defina tu futuro. Tu historia no desaparece, pero sí puede transformarse en una fuente de fuerza y sabiduría."),
      bq("Eres como una llama que no se apaga frente al viento, sino que se vuelve más intensa."),
      p("Cada dificultad que has atravesado ha fortalecido algo dentro de ti, incluso si en su momento no lo podías ver."),
      p("Ahora es tiempo de darle sentido a tu historia, de mirarla con compasión y reconocer que todo lo que has vivido también te ha llevado a ser quién eres hoy."),
      ornament,
      p("Quiero invitarte a hacer un ejercicio muy especial. Escribe una carta a tu versión del pasado."),
      p("Háblale con amor, con honestidad, sin juicios. Reconoce todo lo que ha superado, cada batalla silenciosa, cada momento en el que pensó que no podía más y aun así siguió adelante."),
      p("Agradécele por no rendirse, por sostenerte cuando más lo necesitabas."),
      p("Luego, dale permiso de descansar. Permítete avanzar sin culpa, sin miedo, sin mirar atrás."),
      bq("Porque ya no eres esa misma mujer. Ahora eres consciente, más preparada, más fuerte y más lista para crear la vida que deseas."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 7 — Primeros pasos hacia el valor personal
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 7,
    titleEs: "Primeros pasos hacia el valor personal",
    bodyEs: [
      p("Quiero que entiendas algo desde el inicio de este camino: no estás sola. Estoy aquí porque quiero verte brillar, quiero verte caminar con seguridad, con presencia, con esa energía que no necesita palabras para hacerse notar."),
      p("Esa energía que no depende de lo que llevas puesto, sino de lo que eres."),
      bq("Porque cuando una mujer se reconoce, su presencia habla antes que su voz. Y eso no es superficialidad, es valor personal."),
      p("Es entender que la forma en la que te percibes define cómo el mundo empieza a percibirte también."),
      ornament,
      p("La verdad es simple, aunque a veces incomode: como te ven, te tratan. Como te expresas, es el respeto que recibes. Y, sobre todo, como tú te tratas, será el reflejo de cómo los demás te tratarán."),
      p("Por eso insisto tanto en que vuelvas a ti, en que te enfoques en tu crecimiento y en tu bienestar."),
      p("No puedes esperar amor, detalles o admiración si tú misma no estás cultivando eso dentro de ti. No puedes pedir que te valoren si aún no te reconoces como alguien valiosa."),
      bq("Todo comienza en tu interior, en la forma en la que decides mirarte cada día."),
      ornament,
      p("Si deseas flores, detalles, experiencias bonitas, primero necesitas sentir en lo más profundo que eres merecedora de todo eso, sin culpa, sin duda, sin miedo."),
      p("Creerte digna de lo mejor no es arrogancia, es amor propio. Y ese amor se construye llevándote poco a poco a un estado de plenitud."),
      p("Cuando eres una mujer plena, dejas de aceptar migajas. No te arrastras por atención, ni por afecto, ni por validación externa."),
      p("Sabes poner límites con firmeza, sabes soltar lo que no suma y, lo más importante, sabes alejarte con paz cuando algo deja de hacerte bien."),
      bq("Ese es el verdadero inicio del empoderamiento: reconocerte y respetarte tanto que ya no aceptas menos de lo que mereces."),
      ornament,
      p("Todo comienza con una decisión consciente: elegir creer en ti misma. Elegir mirarte con otros ojos. Elegir hablarte con amor."),
      p("Para empezar, puedes integrar pequeñas prácticas en tu día a día. Regálate unos minutos para afirmarte en voz alta:"),
      affirmations(
        "Soy valiente",
        "Soy capaz",
        "Soy poderosa",
        "Soy magnética",
        "Soy disciplinada",
        "Soy auténtica"
      ),
      p("Permite que esas palabras se siembren dentro de ti. Aunque al principio no lo sientas completamente, con el tiempo comenzarán a convertirse en tu verdad."),
      ornament,
      p("Dedica también unos minutos a conectar con tu respiración, especialmente al iniciar tu día."),
      p("Inhala lento y profundo por la nariz, sintiendo cómo tu abdomen se expande mientras tu pecho permanece suave. Permanece ahí, en calma, agradeciendo tu existencia, reconociendo que estás aquí por una razón."),
      p("Luego exhala lentamente por la boca, soltando tensión, soltando peso. Este pequeño ritual no solo calma tu mente, también te conecta contigo misma."),
      p("Empieza a cuidar tu cuerpo desde el amor, aliméntate mejor, crea momentos para ti, escucha música, muévete, disfruta el proceso de habitarte con más conciencia y presencia."),
      ornament,
      p("La disciplina también es una forma de amor propio. Aprovecha la tecnología para aprender, crecer y evolucionar, no para distraerte constantemente."),
      p("Cada momento que inviertes en ti suma, cada pequeño esfuerzo construye."),
      p("Salir de un estado de inconformidad comienza con un cambio de mentalidad. Nada en tu vida puede transformarse si tú no transformas la manera en la que piensas."),
      p("Rodéate de contenido que te eleve, que te inspire, que te haga cuestionarte. Lee, escucha, aprende."),
      bq("Recuerda que este es solo el inicio. Reconocer tu valor personal es un acto profundo de amor propio que te permitirá construir una nueva realidad."),
      ornament,
      p("Dentro de ese proceso, también puedes explorar ese lado enigmático que muchas veces has admirado en otras mujeres."),
      p("No se trata de convertirte en alguien más, sino de integrar partes de ti que tal vez aún no has permitido florecer."),
      p("Una mujer que conecta con su lado más enigmático no necesita mostrarse completamente. Entiende el poder de lo sutil, de la insinuación, de la presencia que atrae sin esfuerzo."),
      p("Su lenguaje corporal, su mirada y su forma de expresarse comunican seguridad. No busca aprobación, porque sabe quién es y lo que quiere."),
      p("Se mueve con delicadeza, pero también con firmeza. No se deja intimidar fácilmente y aprende a leer su entorno con inteligencia emocional."),
      bq("Su poder no está en manipular, sino en comprender, en elegir cómo actuar y en mantener el control de sí misma con elegancia."),
      ornament,
      p("Es una mujer independiente, que no necesita de otros para validarse. Sabe sostenerse, tomar decisiones y avanzar por su propio camino. Su mundo interno es sólido, aunque su forma de mostrarse sea suave."),
      p("A veces puede parecer un misterio, porque no todo en ella es evidente y eso no la hace distante, la hace interesante. Su esencia no vive en los extremos, sino en los matices."),
      p("Cuida su imagen, su energía y cada detalle de lo que proyecta. Entiende que menos, es más, y que la verdadera elegancia nace de la autenticidad y del amor con el que se construye a sí misma."),
      ornament,
      p("Por último, quiero que recuerdes algo importante: si hay algo en ti que deseas transformar, puedes hacerlo."),
      p("Esa es una de las cosas más hermosas de la vida. Cada día es una oportunidad para crecer, para mejorar, para acercarte a la mujer que deseas ser."),
      p("Mírate al espejo con honestidad, pero también con amor. No te enfoques solo en lo físico. Pregúntate qué quieres cambiar, qué deseas construir, qué necesitas trabajar."),
      bq("Reconoce también todo lo que has superado, todo lo que has logrado. Celebra tu proceso, porque en él está la verdadera transformación."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 8 — Entre heridas y grandeza
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 8,
    titleEs: "Entre heridas y grandeza",
    bodyEs: [
      p("Muchas mujeres han sido heridas más veces de las que pueden recordar. Han entregado su confianza a personas que no supieron valorarla, y han caminado junto a &ldquo;amigas&rdquo; que, en lugar de celebrar su luz, intentaron apagarla."),
      p("Tal vez tú también has estado en ese lugar donde sentías que debías hablar menos, brillar menos, ser menos… solo para no incomodar."),
      p("Quizás intentaste hacerte pequeña, pasar desapercibida, no llamar la atención."),
      bq("Pero hay algo que necesitas comprender con el corazón: cuando una mujer tiene presencia, cuando tiene carácter y una energía que llena el espacio, es imposible que pase desapercibida."),
      ornament,
      p("Muchas veces, lo que incomoda a los demás no es lo que haces, sino lo que representas."),
      p("Tal vez eres esa mujer que ha decidido salir adelante, que trabaja, estudia, se disciplina y sueña con una vida diferente. Una mujer que quiere crecer mientras otras personas aún luchan con sus propias inseguridades."),
      p("Cuando intentaste ayudar, compartir lo que aprendías o tender la mano, tal vez también encontraste rechazo, traiciones o decepciones. Personas que no supieron valorar tu intención."),
      p("Y sí, eso duele. Duele profundamente. Lo suficiente como para hacerte cuestionar muchas cosas dentro de ti."),
      ornament,
      p("Pero en medio de ese dolor, muchas mujeres descubren un refugio más profundo: su fe, su conexión interior, su capacidad de sostenerse incluso cuando todo alrededor parece tambalearse."),
      p("Porque cuando creces con valores, con bondad y con integridad, cuesta comprender por qué otros actúan desde la envidia o la herida."),
      p("Aun así, el proceso continúa. Y llega un momento en el que te miras al espejo y, por primera vez, te encuentras contigo misma de verdad."),
      p("Un momento en el que dejas de culparte por lo que otros sienten ante tu presencia y empiezas a comprender algo muy poderoso."),
      bq("Muchas veces, la crítica, el rechazo o la rivalidad no nacen de lo que haces, sino de lo que eres. Porque hay cualidades que no se pueden fabricar, comprar, ni imitar."),
      p("Tu carisma, tu carácter, tu disciplina, tu sensibilidad, tu fuerza interior… todo eso es único."),
      ornament,
      p("Cuando una mujer reconoce su propio valor, deja de buscar aprobación. Deja de pedir permiso por ser quien es. Se convierte en una mujer completa."),
      p("Una mujer con belleza, pero también con profundidad. Una mujer que ha atravesado el dolor, pero que decidió no permitir que ese dolor definiera su destino."),
      ornament,
      p("Ahora quiero hablarte directamente a ti."),
      p("Tal vez has vivido situaciones que no merecías, y es importante que entiendas algo: muchas de esas experiencias no fueron tu culpa."),
      p("Pero sí eres responsable de lo que decides hacer con tu vida a partir de este momento."),
      p("Tú eliges qué tipo de vida quieres construir. Tú decides qué tipo de amor aceptar. Tú decides que tipo de mujer quieres llegar a ser."),
      question("Déjame hacerte una pregunta importante: si hoy tuvieras 70 años y miraras tu vida hacia atrás, ¿te sentirías orgullosa de lo que estás haciendo ahora mismo?"),
      p("Respóndete con total honestidad."),
      ornament,
      p("Si la respuesta es no, entonces hay algo que necesita cambiar."),
      p("La sociedad impone muchas expectativas sobre ti: ser fuerte, exitosa, responsable, organizada, profesional, presente… todo al mismo tiempo."),
      p("Pero en medio de tantas exigencias, es fácil olvidar lo más importante: quién quieres ser realmente."),
      p("Por eso hoy quiero invitarte a hacer una pausa. A que te detengas. A que te mires con sinceridad y sin juicio."),
      p("Porque solo desde ese lugar puedes empezar a construir una vida que sí tenga sentido para ti."),
      ornament,
      p("Párate frente al espejo y obsérvate más allá de lo físico. Mira tus ojos, tu expresión, tu energía."),
      question("¿Qué ves realmente?"),
      question("¿Cómo te percibes?"),
      question("¿Qué aspectos de tu vida quisieras transformar, no solo en lo externo, sino también en lo mental y en lo espiritual?"),
      p("Permítete responder sin miedo, sin disfrazar la verdad. Porque la transformación no comienza cuando todo está perfecto, comienza cuando decides hacerte cargo de tu propia vida."),
      ornament,
      bq("Recuerda siempre esto: la verdadera transformación nace en el momento en que una mujer decide tomar dirección sobre su vida."),
      p("Cuando asume su poder, cuando deja de esconderse, cuando se elige a sí misma una y otra vez."),
      p("No importa cuántas veces hayas caído, lo importante es que hoy tienes la oportunidad de levantarte con más convicción, con más amor y con más fuerza."),
      p("Tu historia no termina aquí. Este puede ser el inicio de una nueva versión de ti, una versión más auténtica, más libre y más alineada con todo lo que realmente eres capaz de ser."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 9 — Cuatro pilares fundamentales
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 9,
    titleEs: "Cuatro pilares fundamentales que toda mujer debería saber",
    bodyEs: [
      p("Este capítulo no está creado para enseñarte a manipular ni a construir una imagen superficial de ti misma."),
      p("Está diseñado para que descubras y desarrolles cuatro pilares esenciales que pueden transformar tu vida desde lo más profundo: tu mente, tu energía, tu cuerpo y la forma en la que te relacionas con el mundo."),
      bq("Cuando comienzas a trabajar en estos aspectos con conciencia, dejas de buscar validación externa y empiezas a construir una presencia auténtica, sólida y magnética."),
      p("No se trata de convertirte en alguien más, sino de revelar todo lo que ya habita dentro de ti."),
      ornament,
      p("Dominar estos pilares es un proceso, no un resultado inmediato. Es un camino de crecimiento, de autoconocimiento y de conexión contigo misma."),
      p("Cuando tu mente se fortalece, tus pensamientos dejan de limitarte."),
      p("Cuando tu energía se equilibra, tu presencia se vuelve más poderosa."),
      p("Cuando cuidas tu cuerpo, comienzas a habitarte con amor y respeto."),
      p("Cuando transformas la manera en que te relacionas, elevas la calidad de todo lo que permites en tu vida."),
      p("Este no es un cambio superficial, es una evolución completa que se refleja en cada paso que das."),
      ornament,
      p("Cuando integras estos cuatro pilares, algo dentro de ti cambia de forma inevitable."),
      p("Tu forma de caminar, de hablar, de mirar y de sentir se transforma."),
      p("Empiezas a dejar huella sin esfuerzo, no por lo que haces, sino por lo que eres."),
      p("Tu presencia se vuelve inolvidable, no desde la necesidad de impresionar, sino desde la autenticidad."),
      bq("Porque una mujer que se conoce, que se cuida y que se respeta, irradia una fuerza que no se puede ignorar. Ese es el verdadero poder: el que nace desde adentro y se expresa con naturalidad en todo lo que haces."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 10 — Pilar I: Psicología
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 10,
    titleEs: "Pilar I: Psicología — Todo empieza en tu mente",
    bodyEs: [
      bq("Amiga, quiero decirte algo con total honestidad: todo comienza en tu mente."),
      p("Sin confianza, no existe una conexión real contigo misma ni con los demás. Puedes cuidar tu apariencia, arreglarte, practicar cómo te ves frente al espejo… pero si en el fondo no te sientes suficiente, eso se percibe."),
      p("Las personas, en general, tienen una sensibilidad especial para notar cuando alguien duda de su propio valor."),
      p("Por eso, la autoestima no es solo repetirte frases bonitas, es construir una relación contigo donde te reconoces como alguien valiosa, digna y suficiente, sin necesidad de que alguien más venga a confirmarlo."),
      ornament,
      p("Cuando realmente te eliges, algo cambia dentro de ti. Dejas de buscar aprobación y comienzas a vivir desde la seguridad."),
      p("Entiendes que no necesitas convencer a nadie para que se quede, porque tú ya decidiste quedarte contigo."),
      p("Esa confianza genera un impacto profundo en los demás. Despierta una sensación de desafío, porque no eres alguien que se conforma con cualquier cosa. Genera intriga, porque no necesitas explicarte constantemente ni justificar quién eres."),
      bq("Y crea magnetismo, una energía sutil pero poderosa que se siente en tu presencia, en tu forma de habitar cada espacio con calma y autenticidad."),
      ornament,
      p("Esa seguridad no es ruido ni arrogancia, es una tranquilidad interna que habla por sí sola."),
      p("Una mujer que confía en sí misma no necesita preguntar si es suficiente, porque ya lo sabe. Y si alguien no logra verlo, entiende que no es una pérdida, sino una redirección."),
      p("Pero esta confianza no aparece de la noche a la mañana, se construye. Comienza con tu diálogo interno, con la forma en la que te hablas cuando nadie más está presente."),
      p("Empieza cuando decides reconocer lo que te hace única, aquello que solo tú puedes ofrecer al mundo."),
      ornament,
      p("También crece cuando te atreves a salir de tu zona cómoda, cuando enfrentas pequeños retos y te demuestras que eres capaz."),
      p("Cada paso cuenta, cada avance suma. Porque la seguridad no se trata de no tener miedo, sino de avanzar a pesar de él."),
      bq("Cuando tu validación nace desde dentro, todo a tu alrededor empieza a cambiar. Tu energía se alinea, tu presencia se fortalece y las personas lo perciben sin que tengas que esforzarte."),
      p("Porque una mujer que se siente suficiente no lo grita… simplemente lo transmite en cada gesto, en cada palabra y en cada decisión que toma."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 11 — Pilar II: La energía magnética
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 11,
    titleEs: "Pilar II: La energía magnética — No se ve, pero todos la sienten",
    bodyEs: [
      p("Quiero compartir contigo algo que pocas veces se dice con claridad: la verdadera seducción no está en lo que muestras, sino en lo que transmites."),
      p("Existe una fuerza invisible que habita en ti, una energía profunda, misteriosa y magnética que no necesita ser explicada para ser sentida."),
      bq("A esto podemos llamarlo tu energía femenina profunda. No tiene nada que ver con oscuridad negativa, sino con esa parte de ti que es introspectiva, sensual, segura y conectada consigo misma."),
      p("Es la energía de una mujer que no busca agradar, que no actúa para complacer, sino que simplemente es."),
      ornament,
      p("Es esa presencia que se mueve con calma, que no se apresura porque sabe que no necesita perseguir nada."),
      p("Las mujeres que conectan con esta energía no compiten ni se comparan, no sienten la urgencia de explicarse ni de demostrar su valor. Y justamente por eso, resultan profundamente atractivas."),
      p("El misterio genera atracción, y una mujer que no revela todo de sí misma de inmediato despierta curiosidad de manera natural."),
      bq("Su esencia invita a ser descubierta, pero nunca completamente descifrada, y eso crea una conexión que va más allá de lo superficial."),
      ornament,
      p("Esta energía es magnética porque nace desde la autenticidad. Es impredecible, porque no responde a expectativas externas. Es segura, porque no necesita validación."),
      p("Además, despierta un interés genuino en quienes la perciben, porque hay algo en ella que no se puede explicar con palabras."),
      p("Para conectar con esta parte de ti, es importante salir de la mente y regresar al cuerpo. Ahí es donde comienza todo."),
      bq("Tu cuerpo guarda sensaciones, emociones y una sabiduría que muchas veces has ignorado. Volver a ella, es volver a ti."),
      ornament,
      p("Empieza con el movimiento consciente. Permítete bailar sola, sin juicios, sin expectativas."),
      p("Crea un espacio íntimo, con música que te haga sentir, con una luz suave que te envuelva. Muévete despacio, sintiendo cada parte de tu cuerpo, reconociendo tu piel, tu ritmo, tu presencia."),
      p("No lo hagas para ser vista, hazlo para sentirte."),
      p("También puedes conectar a través de tu respiración. Inhala profundamente llevando el aire hacia tu vientre, y exhala lentamente. Imagina que en tu interior se activa una energía cálida, viva, que te conecta con tu centro."),
      ornament,
      p("Tu postura también comunica. Caminar con la espalda recta, con pasos firmes pero suaves, con presencia, cambia completamente la forma en la que te perciben."),
      p("La sensualidad consciente nace de esa conexión. No es actuar, es sentir. Es comer con calma, disfrutar cada bocado, tocar tu cabello con intención, hablar con pausas, permitir que tu voz tenga profundidad."),
      bq("Es vivir cada gesto desde la presencia. Y cuando estás presente en tu cuerpo, los demás lo perciben sin que tengas que decir una sola palabra."),
      ornament,
      p("Existen pequeños rituales que pueden ayudarte a fortalecer esta conexión contigo misma."),
      p("Un baño consciente, por ejemplo, puede convertirse en un momento de reconexión profunda. Usar aromas suaves, tomarte tu tiempo, sentir el agua como un espacio de renovación."),
      p("También puedes escribirle a esa versión tuya más segura, más libre, más magnética, describirla y comenzar a integrarla en tu día a día."),
      p("Puedes crear anclajes que te recuerden quién eres, como un perfume especial que asocies con tu poder personal."),
      p("Cuando integras estos hábitos, comienzas a notar cambios sutiles pero profundos. Tu energía se transforma, tu presencia se vuelve más fuerte y tu conexión contigo misma se profundiza."),
      bq("Cuando una mujer está alineada consigo misma, cuando se habita con seguridad y plenitud, hay algo en ella que simplemente no se puede ignorar. Y ese es tu verdadero magnetismo."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 12 — Pilar III: El arte estético
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 12,
    titleEs: "Pilar III: El arte estético",
    bodyEs: [
      p("Quiero hablarte de algo que muchas veces se minimiza, pero que tiene un impacto profundo en la forma en la que te percibes y en cómo el mundo te percibe: tu imagen."),
      p("En estos tiempos es común escuchar que &ldquo;la belleza no importa&rdquo; o que &ldquo;lo de adentro es lo único que cuenta&rdquo;. Y sí, tu esencia es fundamental, pero también es importante reconocer que el mundo primero te observa y luego te escucha."),
      bq("Tu imagen no es superficialidad, es una extensión de tu amor propio, de tu cuidado y del respeto que sientes hacia ti misma."),
      ornament,
      p("Cuando una mujer cuida su apariencia, no lo hace para cumplir expectativas externas, lo hace porque entiende que su presencia comunica antes que sus palabras."),
      p("Un cuerpo saludable, una piel cuidada, un cabello que refleja atención y una forma de vestir coherente con quién eres, envían un mensaje claro: te valoras, te respetas y te eliges. Y esa energía se devuelve."),
      p("Cuando te ves bien, no solo cambia tu reflejo en el espejo, cambia tu postura, tu forma de caminar, tu manera de expresarte."),
      bq("La seguridad también se construye desde lo que decides proyectar hacia afuera."),
      ornament,
      p("No necesitas grandes recursos para construir una imagen poderosa, pero sí necesitas intención y claridad."),
      p("Elegir prendas que te representen, que resalten tu figura con elegancia y que te hagan sentir cómoda es clave. Los detalles importan: la ropa limpia, bien cuidada, en armonía contigo."),
      p("Colores como el negro, el blanco, el rojo o los tonos neutros pueden ayudarte a transmitir sofisticación sin esfuerzo. Tener piezas básicas que te hagan sentir segura, usar accesorios sutiles y elegir un aroma que te represente, son pequeñas decisiones que construyen una gran presencia."),
      ornament,
      p("Cada vez que elijas cómo vestirte, hazte una pregunta simple pero poderosa:"),
      question("¿Esto refleja a la mujer en la que me estoy convirtiendo?"),
      p("Si la respuesta es no, date el permiso de cambiarlo. Tu imagen es una herramienta para recordarte quién eres."),
      p("Y dentro de esa presencia, tu voz también tiene un papel importante. Hablar con calma, con intención, sin prisa, permite que tu mensaje tenga más impacto."),
      p("Las pausas, el tono, la forma en la que eliges tus palabras, todo comunica. No necesitas hablar más fuerte, necesitas hablar con más conciencia."),
      ornament,
      p("Permítete jugar con tu voz, con los silencios, con la energía que transmites al expresarte. Evita llenar cada espacio con palabras innecesarias. A veces, el silencio también tiene presencia."),
      bq("Cuando hablas desde la calma, desde la seguridad, generas una sensación de misterio y profundidad. Eso conecta."),
      ornament,
      p("Puedes apoyarte en una herramienta muy poderosa: crear una versión consciente de ti misma que represente tu máximo potencial."),
      p("No es alguien falso, es una parte de ti que decides activar con intención. Imagina cómo se mueve, cómo se expresa, cómo se viste, cómo toma decisiones. Dale forma, dale presencia."),
      p("Escríbela si lo necesitas. Y luego empieza a integrarla en tu día a día. Esa versión no está lejos, vive dentro de ti, esperando que le des espacio para manifestarse."),
      ornament,
      p("Puedes crear pequeños rituales para conectar con esa versión. Tal vez un perfume especial, una prenda que te haga sentir poderosa, una canción que active tu energía."),
      p("Practica frente al espejo, observa tu postura, tu mirada, tu expresión. No desde el juicio, sino desde la construcción consciente de tu presencia."),
      bq("Recuerda esto siempre: no estás creando a alguien nuevo, estás despertando a la mujer que siempre ha estado en ti, pero que tal vez había permanecido en silencio por miedo o por inseguridad."),
      p("Tu imagen, tu voz y tu presencia no son herramientas vacías, son formas de expresar tu esencia. Y cuando alineas lo que eres con lo que proyectas, te conviertes en una mujer auténtica, segura y profundamente inolvidable."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 13 — Checklist Diario
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 13,
    titleEs: "Checklist Diario de Estilo y Presencia",
    bodyEs: [
      bq("Este es tu recordatorio diario: tu presencia es un reflejo de tu poder interior. No se trata solo de cómo te ves, sino de cómo te sientes al habitarte."),
      p("Cada mañana es una oportunidad para elegirte, para alinearte contigo y salir al mundo desde un lugar de seguridad, calma y autenticidad."),
      p("Este checklist no es una obligación, es una guía amorosa para reconectar contigo antes de empezar tu día. Cuando tú te eliges primero, todo lo demás comienza a alinearse con esa decisión."),
      ornament,
      `<h3 class="checklist-section">Cuerpo y energía</h3>`,
      checklist(
        "Me observo y me siento bien conmigo misma",
        "Mi aroma me representa hoy",
        "Mi postura refleja seguridad (espalda recta, hombros abiertos, cuello relajado)",
        "Respiré profundo y conecté con mi centro antes de salir",
        "Activé mi energía con movimiento: estiramiento, caminata o conexión consciente",
        "Mi energía se siente tranquila — si hay ansiedad, respiro y vuelvo a mí"
      ),
      ornament,
      `<h3 class="checklist-section">Cuidado personal</h3>`,
      checklist(
        "Cuidé mi piel con amor y atención",
        "Mi cabello refleja la dedicación que me doy",
        "Mi maquillaje (si uso) me hace sentir despierta y alineada",
        "Lo que llevo puesto está limpio, cuidado y en armonía con quien soy",
        "Elegí colores que me hacen sentir fuerte, presente y auténtica",
        "Mis zapatos sostienen mi postura y mi forma de caminar",
        "Mis accesorios son sutiles pero intencionales"
      ),
      ornament,
      `<h3 class="checklist-section">Voz y actitud</h3>`,
      checklist(
        "Hablo con calma y seguridad, con un tono que refleja mi confianza",
        "Juego con las pausas y la mirada — todo en mí comunica",
        "Conecté con mi intención del día",
        "Recuerdo quién soy, qué merezco y hacia dónde me dirijo"
      ),
      ornament,
      `<h3 class="checklist-section">Presencia interior</h3>`,
      checklist(
        "Activé mi versión más poderosa desde adentro",
        "Me pregunté cómo caminaría, cómo actuaría, cómo se sentiría",
        "Hice de este momento previo a salir un pequeño ritual conmigo misma",
        "Salgo al mundo desde un lugar de seguridad, calma y autenticidad"
      ),
      ornament,
      bq("Haz de este momento previo a salir de casa un pequeño ritual contigo misma. Porque no se trata solo de prepararte para el mundo, se trata de recordarte quién eres antes de enfrentarlo."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 14 — Pilar IV: Liderazgo
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 14,
    titleEs: "Pilar IV: Liderazgo",
    bodyEs: [
      p("Amiga, existe un tipo de poder que no necesita imponerse, que no levanta la voz ni exige para ser reconocido."),
      bq("Es un liderazgo silencioso, elegante, profundamente magnético. Una mujer que domina este arte no persigue, no se desgasta tratando de controlar… simplemente dirige desde su presencia."),
      p("Su energía marca el ritmo, su seguridad guía la dinámica y su esencia deja huella. No necesita estar disponible todo el tiempo para ser recordada. Al contrario, su misterio la hace aún más interesante."),
      ornament,
      p("Liderar no es mandar, es inspirar. Es lograr que el otro quiera estar cerca, quiera compartir contigo, quiera ganarse un lugar en tu vida."),
      p("Para lograrlo, necesitas aprender a ser firme en lo que deseas, pero suave en la forma en la que lo expresas. No se trata de imponer, sino de comunicar con inteligencia emocional."),
      p("Cuando hablas desde la calma, desde la seguridad, tus palabras tienen más peso."),
      p("También es importante que mantengas tus límites claros. Una mujer que sabe lo que acepta y lo que no, transmite respeto sin necesidad de confrontación."),
      ornament,
      p("El silencio también es una herramienta poderosa. No necesitas responder de inmediato ni justificar cada decisión."),
      bq("Cuando aprendes a manejar los tiempos, a pausar, a observar antes de actuar, tomas el control de tu energía. Y eso se percibe."),
      p("Parte de este liderazgo también está en saber dosificar tu presencia. No se trata de alejarte por estrategia fría, sino de respetar tu espacio, tu tiempo y tu energía."),
      p("Cuando estás completamente disponible todo el tiempo, pierdes valor ante ti misma. En cambio, cuando eliges cuándo y cómo estar, tu presencia se vuelve más significativa."),
      ornament,
      p("El equilibrio entre dar y retirarte es una danza sutil."),
      p("Permítete compartir momentos genuinos, mostrar interés, conectar… pero también aprende a cerrar esos momentos desde un lugar de amor propio."),
      p("Saber irte en el momento adecuado deja una sensación abierta, una energía que invita a querer más."),
      bq("Esto no es manipulación, es autocuidado. Es entender que tu tiempo y tu energía son valiosos. Y cuando tú lo reconoces, los demás también comienzan a hacerlo."),
      ornament,
      p("El interés también se comunica con equilibrio. No necesitas mostrar todo de ti desde el inicio. Permítete ser descubierta poco a poco."),
      p("Escucha, pregunta, comparte, pero siempre manteniendo una parte de ti en resguardo. Eso no es distancia, es profundidad."),
      p("Cuando alguien siente que aún hay más por conocer, la conexión se vuelve más interesante."),
      p("Además, mantener una vida propia, con objetivos, pasatiempos y espacios personales, no solo te fortalece, también te hace más auténtica."),
      ornament,
      p("Recuerda siempre que tú lideras tu mundo, tus emociones y tu energía."),
      p("No necesitas rogar atención ni afecto. Tu compañía es un espacio que se valora, no algo que se exige. Y ese valor comienza en cómo te percibes tú misma."),
      p("Tu postura, tu mirada, la forma en la que te mueves, todo habla por ti. Caminar con calma, mirar con presencia, moverte con intención, son detalles que transforman completamente la forma en la que te perciben."),
      ornament,
      p("Tu voz también es una herramienta poderosa. Hablar con un tono sereno, con pausas, con intención, permite que tu mensaje tenga más impacto."),
      p("No necesitas llenar cada silencio, a veces lo que no se dice también comunica. Jugar con la entonación, con la calidez, con la profundidad, hace que tu comunicación sea más envolvente."),
      bq("Porque cuando todo en ti está alineado —tu mente, tu cuerpo y tu energía— tu presencia se vuelve inolvidable."),
      ornament,
      p("Mientras la otra persona habla, inclina ligeramente tu cabeza, sostén la mirada con suavidad y permite que una sonrisa leve acompañe tu expresión."),
      p("Si deseas dejar una sensación de intriga, puedes cerrar una idea y desviar la mirada por un instante, como si guardaras algo más por revelar."),
      p("El contacto físico también puede ser una herramienta de conexión cuando se usa con conciencia. Un roce sutil, una mano que acompaña un gesto, pueden generar cercanía sin necesidad de palabras."),
      ornament,
      p("Ahora quiero hablarte de algo importante si estás en pareja o casada."),
      p("Tu vida no se detiene en una relación, al contrario, continúa evolucionando contigo. Estar con alguien no significa perderte, significa compartir el camino sin apagar tu luz."),
      p("Tu identidad, tus sueños y tus pasiones siguen siendo tuyos, y cuando los cuidas, también enriqueces tu relación."),
      bq("Recuerda quién eres más allá de los roles que ocupas. Eres una persona con intereses, talentos y una esencia única que merece ser cultivada todos los días."),
      ornament,
      p("Es importante que cuides tu espacio personal, aunque sea por unos minutos al día."),
      p("También es fundamental que te expreses, que compartas cómo te sientes con las personas cercanas a ti. Guardar lo que sientes por miedo a incomodar solo te aleja de tu bienestar."),
      p("Rodéate de personas que te escuchen, que te comprendan, que te impulsen. Y si en algún momento sientes que necesitas apoyo más profundo, buscar ayuda es un acto de amor propio y valentía."),
      ornament,
      p("Una relación sana no apaga tu brillo, lo potencia. Es el encuentro de dos personas que se acompañan sin dejar de ser ellas mismas."),
      p("El autocuidado también forma parte de este proceso. No es egoísmo, es una necesidad. Regálate momentos contigo, crea espacios donde puedas escucharte, sentirte y reconectar con tu interior."),
      ornament,
      p("Creer en tu poder de transformación es uno de los actos más valientes que puedes elegir."),
      p("A veces, la tristeza o la confusión pueden hacerte sentir que todo está perdido, como si tu luz se hubiera apagado."),
      bq("Pero quiero recordarte algo: recuperar tu brillo no solo es posible, es tu derecho. Dentro de ti sigue existiendo esa fuerza, esa energía que te pertenece."),
      p("Repite para ti misma: &ldquo;Soy luz, soy vida y merezco brillar sin pedir permiso.&rdquo;"),
      ornament,
      p("El primer paso es reconocer la situación con honestidad. Entender que vivir sometida no es amor, sino una forma de perderte a ti misma."),
      bq("El amor verdadero no controla, no limita, no apaga… el amor impulsa, acompaña y respeta."),
      p("Empieza a poner pequeños límites en tu día a día. No tienen que ser grandes cambios de inmediato. A veces, elegir qué quieres hacer, con quién compartir tu tiempo o cómo deseas vivir tu rutina ya es un paso enorme."),
      p("Cada decisión consciente que tomas es una forma de recuperar tu poder. Y recuerda que no tienes que hacerlo sola."),
      ornament,
      p("Vuelve a vivir desde tu esencia. El hecho de que alguien haya absorbido tu energía no significa que la hayas perdido para siempre."),
      p("Esa fuerza sigue dentro de ti, esperando que la reconozcas y la reclames."),
      bq("Amarte a ti misma no es un acto de rebeldía, es un acto de supervivencia. No viniste a este mundo a ser sombra de nadie. Viniste a ser luz, a ocupar tu espacio, a vivir con plenitud."),
    ].join("\n"),
  },

  /* ══════════════════════════════════════════════════════════════
     CAPÍTULO 15 — Enfócate espiritualmente
  ══════════════════════════════════════════════════════════════ */
  {
    chapterNumber: 15,
    titleEs: "Enfócate espiritualmente",
    bodyEs: [
      p("Quiero invitarte a que te enfoques también en tu dimensión espiritual."),
      bq("Cuando sientas que la vida pesa más de lo que puedes sostener, recuerda que no estás sola. Hay una presencia que te acompaña incluso en los momentos en los que te sientes más perdida."),
      p("Dios no te creó para vivir apagada ni sometida, te creó para brillar con tu propia luz."),
      ornament,
      p("Cuando una mujer cultiva una relación íntima con Dios, encuentra un refugio que ninguna circunstancia puede arrebatarle."),
      p("Es una paz que no depende de lo externo, sino de una conexión profunda que sostiene su corazón. Esa cercanía la transforma desde adentro: su energía se vuelve más serena, su mirada más tranquila y su presencia transmite una calma que no necesita explicarse."),
      p("Porque cuando sabes que estás sostenida por algo más grande que tú, dejas de temerle tanto a lo que sucede afuera."),
      ornament,
      p("Ser íntima con Dios no significa cumplir reglas ni aparentar espiritualidad. Es abrir el corazón con honestidad, hablar desde lo más profundo, compartir tus miedos, tus heridas, tus sueños y tus anhelos."),
      p("Es caminar con la certeza de que no estás sola. Y cuando esa relación se fortalece, algo en ti cambia: las preocupaciones pierden peso, tu mente se aclara y tu energía comienza a reflejar una confianza que nace desde el alma."),
      ornament,
      p("Puedes comenzar con prácticas simples. Dedica unos minutos cada día para hablar con él como hablarías con una amiga íntima."),
      p("Permítete también el silencio, ese espacio donde puedes escucharte y sentir la guía que habita en tu interior."),
      p("Acércate a su palabra, nutre tu mente con sabiduría y termina cada día agradeciendo."),
      bq("La gratitud abre puertas invisibles y cambia la forma en la que percibes tu vida. Y sobre todo, entrégale tus cargas. No tienes que sostener todo sola."),
      ornament,
      p("Sin embargo, quiero decirte algo con total honestidad: la fe también requiere acción."),
      p("Muchas personas hablan de manifestar la vida que desean, pero la verdad es que nada cambia si tú no te mueves."),
      p("Orar es importante, confiar también… pero actuar es indispensable."),
      bq("Las oportunidades, los cambios y los resultados llegan cuando decides dar pasos, incluso con miedo. Porque la vida no responde a lo que sueñas en silencio, responde a lo que te atreves a construir con tus decisiones diarias."),
      ornament,
      p("Todo lo que te rodea influye en quién te conviertes. Tus relaciones, tus amistades, los espacios en los que te mueves, todo aporta o resta en tu crecimiento. Por eso es tan importante elegir con conciencia."),
      p("No necesitas demostrar nada para que alguien se quede en tu vida. Solo necesitas ser tú, en tu verdad."),
      p("No hay un molde perfecto en el que debas encajar. Eres suficiente tal como eres."),
      ornament,
      p("Escucha tu intuición. Ese sentimiento que te alerta, que te guía, que te hace cuestionar. No es casualidad, es la memoria de todo lo que has vivido hablándote."),
      question("Y hoy quiero dejarte una pregunta que puede transformar tu forma de ver tu vida: si este fuera tu último día, ¿estarías en paz con lo que eres, con lo que haces, con lo que has construido?"),
      p("Si la respuesta es no, entonces no sigas esperando. La vida no está hecha para arrastrarte, está hecha para que la elijas."),
      ornament,
      p("También debes entender que crecer, brillar y evolucionar tiene un precio. No todas las personas celebrarán tu transformación. Algunas se incomodarán, otras intentarán frenarte, y otras simplemente se alejarán."),
      p("Pero eso no significa que estés haciendo algo mal. Muchas veces, significa todo lo contrario."),
      p("Cuando una mujer se vuelve fuerte, consciente y auténtica, deja de encajar en espacios donde antes se minimizaba."),
      bq("Recuerda: no viniste a este mundo a encajar, viniste a ser. Y ser, en toda tu esencia, implica aceptar que no todos podrán caminar contigo."),
      ornament,
      p("Por eso es tan importante que te mantengas firme en tu valor, que no permitas que nadie apague tu luz por miedo a incomodar."),
      p("Y, aun así, a pesar de todo, siempre hay algo que quiero que recuerdes: todo tiene su recompensa."),
      p("Cada vez que eliges crecer, cada vez que decides no conformarte, cada vez que te mantienes fiel a ti, estás construyendo una vida más alineada con quien realmente eres."),
      bq("Puede que no sea fácil, pero es real. Y al final del camino, siempre ganas. Porque te tienes a ti. Porque te elegiste. Porque decidiste no rendirte."),
      ornament,
      `<div class="final-message">`,
      p("Este no es solo el final de un libro. Es el inicio de una nueva versión de ti."),
      p("Una mujer más consciente, más fuerte, más conectada consigo misma y con su propósito."),
      p("A partir de hoy, todo depende de ti. De las decisiones que tomes, de los límites que pongas, del amor que te tengas."),
      p("Así que camina con firmeza, con fe y con la certeza de que estás construyendo una vida que sí te representa."),
      bq("Y nunca lo olvides: Naciste para brillar."),
      `</div>`,
    ].join("\n"),
  },
];

/* ─── main ────────────────────────────────────────────────────── */
async function seed() {
  console.log(`\nSeeding ${CHAPTERS.length} chapters into book_chapters…\n`);
  for (const ch of CHAPTERS) {
    await query(
      `INSERT INTO book_chapters (format, chapter_number, title_es, body_es)
       VALUES ('ebook', $1, $2, $3)
       ON CONFLICT (format, chapter_number) DO UPDATE SET
         title_es = EXCLUDED.title_es,
         body_es  = EXCLUDED.body_es`,
      [ch.chapterNumber, ch.titleEs, ch.bodyEs]
    );
    console.log(`  ✓ Cap ${ch.chapterNumber}: ${ch.titleEs}`);
  }
  console.log("\nDone! All chapters seeded. ✦\n");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
