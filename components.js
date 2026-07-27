const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Lê o valor real (ex: "#4B4E9E") de uma CSS custom property definida em
// style.css. O canvas não entende "var(--cor)" — só CSS normal entende —
// então pro glitter precisamos do hex de verdade, não da referência.
function tokenCSS(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

// As 4 cores da paleta "Espaço Curioso", em pares [cor, cor-escura-pro-texto/badge].
// "cor" fica como var() pra uso em CSS inline; "escura" já vem resolvida
// em hex pra poder ser usada com ctx.fillStyle no canvas.
const ACENTOS = [
  { cor: "var(--color-indigo)", escura: tokenCSS("--color-indigo-dark") },
  { cor: "var(--color-orange)", escura: tokenCSS("--color-orange-dark") },
  { cor: "var(--color-mint)", escura: tokenCSS("--color-mint-dark") },
  { cor: "var(--color-magenta)", escura: tokenCSS("--color-magenta-dark") },
];

function acentoParaIndice(indice) {
  return ACENTOS[indice % ACENTOS.length];
}

// Estado do app: quais letras já foram praticadas e qual está aberta agora.
// Não persiste entre recarregamentos (por escolha) — sempre começa zerado.
const praticadas = new Array(ALFABETO.length).fill(false);
let letraAtualIndice = 0;

// ============================================
// ProgressBadge
// ============================================

function ProgressBadge() {
  const badge = document.createElement("span");
  badge.className = "progress-badge";
  badge.setAttribute("aria-hidden", "true");
  badge.textContent = "✓";
  return badge;
}

// ============================================
// LetterTile
// ============================================

function LetterTile(letra, indice) {
  const acento = acentoParaIndice(indice);
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "letter-tile";
  tile.style.setProperty("--tile-accent", acento.cor);
  tile.textContent = letra;
  tile.setAttribute(
    "aria-label",
    `Letra ${letra}${praticadas[indice] ? ", já praticada" : ""}`
  );

  if (praticadas[indice]) {
    tile.appendChild(ProgressBadge());
  }

  tile.addEventListener("click", () => abrirTelaDeTraco(indice));
  return tile;
}

// ============================================
// NavButton
// ============================================

function NavButton({ texto, variante, aoClicar, ariaLabel }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `nav-button nav-button--${variante}`;
  btn.textContent = texto;
  if (ariaLabel) btn.setAttribute("aria-label", ariaLabel);
  btn.addEventListener("click", aoClicar);
  return btn;
}

// ============================================
// TraceCanvas
// ============================================

function TraceCanvas(letra, acento) {
  const wrap = document.createElement("div");
  wrap.className = "trace-canvas-wrap";
  wrap.style.setProperty("--canvas-accent", acento.cor);

  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 320;
  wrap.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let desenhando = false;
  let tracouAlgo = false;

  function desenharContorno() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tracos = LETTER_PATHS[letra] || [];
    const margem = 55;
    const escala = (canvas.width - margem * 2) / 100;
    const tracosNoCanvas = tracos.map((pontos) =>
      pontos.map(([x, y]) => [margem + x * escala, margem + y * escala])
    );
    desenharTracosPontilhados(ctx, tracosNoCanvas, { espacamento: 12, raio: 3, cor: "#DAD5F5" });
  }

  // Espalha uma "glitter" colorida perto do ponto onde o dedo passou —
  // é o efeito de confete seguindo o traço.
  function desenharGlitter(x, y) {
    for (let i = 0; i < 3; i++) {
      const acentoAleatorio = ACENTOS[Math.floor(Math.random() * ACENTOS.length)];
      const offsetX = (Math.random() - 0.5) * 24;
      const offsetY = (Math.random() - 0.5) * 24;
      const raio = 2 + Math.random() * 3;

      ctx.beginPath();
      ctx.arc(x + offsetX, y + offsetY, raio, 0, Math.PI * 2);
      ctx.fillStyle = acentoAleatorio.escura;
      ctx.fill();
    }
  }

  function posicaoDoEvento(evento) {
    const rect = canvas.getBoundingClientRect();
    const ponto = evento.touches ? evento.touches[0] : evento;
    return {
      x: ((ponto.clientX - rect.left) / rect.width) * canvas.width,
      y: ((ponto.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function iniciarTraco(evento) {
    evento.preventDefault();
    desenhando = true;
    tracouAlgo = true;
    const { x, y } = posicaoDoEvento(evento);
    desenharGlitter(x, y);
  }

  function continuarTraco(evento) {
    if (!desenhando) return;
    evento.preventDefault();
    const { x, y } = posicaoDoEvento(evento);
    desenharGlitter(x, y);
  }

  function terminarTraco() {
    if (!desenhando) return;
    desenhando = false;
    if (tracouAlgo) {
      praticadas[letraAtualIndice] = true;
      atualizarContador();
    }
  }

  canvas.addEventListener("pointerdown", iniciarTraco);
  canvas.addEventListener("pointermove", continuarTraco);
  canvas.addEventListener("pointerup", terminarTraco);
  canvas.addEventListener("pointerleave", terminarTraco);

  desenharContorno();

  return { wrap, limpar: desenharContorno };
}

// ============================================
// Renderização das duas telas
// ============================================

function renderizarGrade() {
  const grade = document.getElementById("tela-grade");
  grade.innerHTML = "";
  ALFABETO.forEach((letra, indice) => {
    grade.appendChild(LetterTile(letra, indice));
  });
}

function atualizarContador() {
  const total = praticadas.filter(Boolean).length;
  document.getElementById("contador").textContent = `${total} de ${ALFABETO.length} praticadas`;
}

function abrirTelaDeTraco(indice) {
  letraAtualIndice = indice;
  document.getElementById("tela-grade").hidden = true;
  document.getElementById("tela-traco").hidden = false;
  renderizarTelaDeTraco();
}

function fecharTelaDeTraco() {
  document.getElementById("tela-traco").hidden = true;
  document.getElementById("tela-grade").hidden = false;
  renderizarGrade();
}

let limparCanvasAtual = () => {};

function renderizarTelaDeTraco() {
  const letra = ALFABETO[letraAtualIndice];
  const acento = acentoParaIndice(letraAtualIndice);

  const raiz = document.getElementById("tela-traco");
  raiz.innerHTML = "";
  raiz.className = "trace-screen";

  const nav = document.createElement("div");
  nav.className = "trace-nav";
  nav.appendChild(
    NavButton({
      texto: "‹",
      variante: "arrow",
      ariaLabel: "Letra anterior",
      aoClicar: () => mudarLetra(-1),
    })
  );

  const label = document.createElement("span");
  label.className = "trace-letter-label";
  label.textContent = letra;
  nav.appendChild(label);

  nav.appendChild(
    NavButton({
      texto: "›",
      variante: "arrow",
      ariaLabel: "Próxima letra",
      aoClicar: () => mudarLetra(1),
    })
  );

  raiz.appendChild(
    NavButton({
      texto: "Todas as letras",
      variante: "pill",
      aoClicar: fecharTelaDeTraco,
    })
  );
  raiz.appendChild(nav);

  const { wrap, limpar } = TraceCanvas(letra, acento);
  limparCanvasAtual = limpar;
  raiz.appendChild(wrap);

  const acoes = document.createElement("div");
  acoes.className = "trace-actions";
  acoes.appendChild(
    NavButton({
      texto: "Limpar",
      variante: "pill",
      aoClicar: () => limparCanvasAtual(),
    })
  );
  raiz.appendChild(acoes);
}

function mudarLetra(delta) {
  letraAtualIndice = (letraAtualIndice + delta + ALFABETO.length) % ALFABETO.length;
  renderizarTelaDeTraco();
}

renderizarGrade();
atualizarContador();
