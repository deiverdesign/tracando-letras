// ============================================
// Sistema de "esqueleto" das letras
//
// Cada letra é uma lista de TRAÇOS (uma vez que a caneta encosta no
// papel até levantar). Cada traço é uma lista de pontos numa grade
// normalizada de 0 a 100 — o esqueleto da letra, sem espessura. É por
// isso que o pontilhado fica numa linha só, no meio do traçado real,
// e não na borda de uma letra grossa.
// ============================================

function pontosDeLinha(p0, p1, n = 12) {
  const pontos = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    pontos.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]);
  }
  return pontos;
}

// Curva de Bézier quadrática: p0 -> p1, puxada na direção de "controle".
function pontosDeCurva(p0, controle, p1, n = 20) {
  const pontos = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * controle[0] + t ** 2 * p1[0];
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * controle[1] + t ** 2 * p1[1];
    pontos.push([x, y]);
  }
  return pontos;
}

// Arco de círculo. Ângulos em graus, 0° = direita, 90° = baixo (eixo Y
// da tela cresce pra baixo). anguloFinal pode ser menor que anguloInicial
// — a interpolação é sempre linear entre os dois, o que deixa escolher
// livremente por qual lado o arco passa.
function pontosDeArco(centro, raio, anguloInicial, anguloFinal, n = 24) {
  const pontos = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const angulo = ((anguloInicial + (anguloFinal - anguloInicial) * t) * Math.PI) / 180;
    pontos.push([centro[0] + raio * Math.cos(angulo), centro[1] + raio * Math.sin(angulo)]);
  }
  return pontos;
}

// Arco de elipse: igual pontosDeArco, mas com raio X e Y diferentes —
// deixa a "barriga" bem larga sem perder o arredondado (uma barriga
// larga feita só esticando o raio de um círculo normal fica pontuda).
function pontosDeArcoElipse(centro, raioX, raioY, anguloInicial, anguloFinal, n = 24) {
  const pontos = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const angulo = ((anguloInicial + (anguloFinal - anguloInicial) * t) * Math.PI) / 180;
    pontos.push([centro[0] + raioX * Math.cos(angulo), centro[1] + raioY * Math.sin(angulo)]);
  }
  return pontos;
}

function concatPontos(...listas) {
  return listas.flat();
}

// Grade de referência usada por quase toda letra:
// x: 15 (esquerda) a 85 (direita), centro em 50
// y: 10 (topo) a 90 (base)

const LETTER_PATHS = {
  A: [
    concatPontos(pontosDeLinha([15, 90], [50, 10]), pontosDeLinha([50, 10], [85, 90])),
    pontosDeLinha([30, 58], [70, 58]),
  ],
  B: [
    pontosDeLinha([25, 10], [25, 90]),
    pontosDeArcoElipse([25, 30], 45, 20, -90, 90, 20),
    pontosDeArcoElipse([25, 70], 48, 20, -90, 90, 20),
  ],
  C: [pontosDeArco([50, 50], 38, -60, -300, 30)],
  D: [pontosDeLinha([25, 10], [25, 90]), pontosDeArcoElipse([25, 50], 60, 40, -90, 90, 30)],
  E: [
    pontosDeLinha([25, 10], [25, 90]),
    pontosDeLinha([25, 10], [75, 10]),
    pontosDeLinha([25, 50], [65, 50]),
    pontosDeLinha([25, 90], [75, 90]),
  ],
  F: [
    pontosDeLinha([25, 10], [25, 90]),
    pontosDeLinha([25, 10], [75, 10]),
    pontosDeLinha([25, 50], [65, 50]),
  ],
  G: [
    pontosDeArco([50, 50], 38, 20, 340, 36),
    pontosDeLinha([86, 63], [52, 63], 10),
  ],
  H: [
    pontosDeLinha([25, 10], [25, 90]),
    pontosDeLinha([75, 10], [75, 90]),
    pontosDeLinha([25, 50], [75, 50]),
  ],
  I: [pontosDeLinha([50, 10], [50, 90])],
  J: [concatPontos(pontosDeLinha([65, 10], [65, 60]), pontosDeArco([50, 60], 15, 0, 110, 16))],
  K: [
    pontosDeLinha([25, 10], [25, 90]),
    pontosDeLinha([25, 50], [75, 10]),
    pontosDeLinha([25, 50], [75, 90]),
  ],
  L: [concatPontos(pontosDeLinha([25, 10], [25, 90]), pontosDeLinha([25, 90], [75, 90]))],
  M: [
    concatPontos(
      pontosDeLinha([15, 90], [15, 10]),
      pontosDeLinha([15, 10], [50, 55]),
      pontosDeLinha([50, 55], [85, 10]),
      pontosDeLinha([85, 10], [85, 90])
    ),
  ],
  N: [
    concatPontos(
      pontosDeLinha([20, 90], [20, 10]),
      pontosDeLinha([20, 10], [80, 90]),
      pontosDeLinha([80, 90], [80, 10])
    ),
  ],
  O: [pontosDeArco([50, 50], 38, 0, 360, 40)],
  P: [pontosDeLinha([25, 10], [25, 90]), pontosDeArcoElipse([25, 30], 45, 20, -90, 90, 20)],
  Q: [pontosDeArco([50, 50], 38, 0, 360, 40), pontosDeLinha([62, 62], [85, 88])],
  R: [
    pontosDeLinha([25, 10], [25, 90]),
    pontosDeArcoElipse([25, 30], 45, 20, -90, 90, 20),
    pontosDeLinha([25, 50], [75, 90]),
  ],
  S: [
    concatPontos(
      pontosDeCurva([65, 15], [20, 35], [50, 50], 18),
      pontosDeCurva([50, 50], [80, 65], [35, 85], 18)
    ),
  ],
  T: [pontosDeLinha([15, 10], [85, 10]), pontosDeLinha([50, 10], [50, 90])],
  U: [
    concatPontos(
      pontosDeLinha([25, 10], [25, 60]),
      pontosDeArco([50, 60], 25, 180, 0, 20),
      pontosDeLinha([75, 60], [75, 10])
    ),
  ],
  V: [concatPontos(pontosDeLinha([15, 10], [50, 90]), pontosDeLinha([50, 90], [85, 10]))],
  W: [
    concatPontos(
      pontosDeLinha([10, 10], [30, 90]),
      pontosDeLinha([30, 90], [50, 40]),
      pontosDeLinha([50, 40], [70, 90]),
      pontosDeLinha([70, 90], [90, 10])
    ),
  ],
  X: [pontosDeLinha([20, 10], [80, 90]), pontosDeLinha([80, 10], [20, 90])],
  Y: [
    concatPontos(pontosDeLinha([20, 10], [50, 50]), pontosDeLinha([50, 50], [50, 90])),
    pontosDeLinha([80, 10], [50, 50]),
  ],
  Z: [
    concatPontos(
      pontosDeLinha([20, 10], [80, 10]),
      pontosDeLinha([80, 10], [20, 90]),
      pontosDeLinha([20, 90], [80, 90])
    ),
  ],
};

// Desenha uma lista de traços como pontinhos espaçados igualmente ao
// longo do caminho (por comprimento real, não por índice do array —
// senão trechos retos e curvos ficariam com espaçamento diferente).
function desenharTracosPontilhados(ctx, tracos, { espacamento = 12, raio = 2.5, cor = "#DAD5F5" } = {}) {
  tracos.forEach((pontos) => {
    let acumulado = 0;
    let proximoPonto = 0;
    for (let i = 0; i < pontos.length - 1; i++) {
      const [x0, y0] = pontos[i];
      const [x1, y1] = pontos[i + 1];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const distancia = Math.hypot(dx, dy);

      while (distancia > 0 && acumulado + distancia >= proximoPonto) {
        const t = (proximoPonto - acumulado) / distancia;
        const x = x0 + dx * t;
        const y = y0 + dy * t;
        ctx.beginPath();
        ctx.arc(x, y, raio, 0, Math.PI * 2);
        ctx.fillStyle = cor;
        ctx.fill();
        proximoPonto += espacamento;
      }
      acumulado += distancia;
    }
  });
}
