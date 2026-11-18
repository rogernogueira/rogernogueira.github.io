/* Lição 1 · A ficha do processo.
   - Oficina (slide 8): mostra o que o Python fez com a célula montada. Os resultados vêm de
     window.L1_SAIDAS, gerado executando o Python de verdade (scripts/saidas-python-licao01.py);
     nada é deduzido aqui. Grava "sim" ou "" no campo oculto #l1-oficina-valida e dispara "input",
     para o requisito voltar a pendente quando a solução é desfeita.
   - Vídeo (slide 2): fachada local; o iframe do YouTube só é criado no clique.
   - Limite (slide 11): demonstração; não persiste e não conta para a conclusão.
   Carregado depois de licao-runtime.js, que já restaurou os campos salvos. */
(function () {
  "use strict";

  const S = window.L1_SAIDAS || null;
  const CAMPOS = ["numero_processo", "nome_parte", "vara", "valor_causa"];
  const ORDEM = ["numero_processo", "nome_parte", "vara", "valor_causa", "taxa"];
  const LINHA_DA_VARIAVEL = { 1: "numero_processo", 2: "nome_parte", 3: "vara", 4: "valor_causa", 5: "custas" };

  /* ---------------- Oficina ---------------- */
  const selects = Array.from(document.querySelectorAll("[data-l1-campo]"));
  const oculto = document.getElementById("l1-oficina-valida");
  const painel = document.querySelector('[data-simulador="l1-oficina"] [data-sim-result]');
  const codigo = document.querySelector("[data-l1-codigo]");
  const conta = document.querySelector("[data-l1-conta]");

  const escolha = nome => selects.find(s => s.dataset.l1Campo === nome)?.value || "";
  const curto = (texto, max = 18) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto);
  const classeDoTipo = tipo => ({ str: "l1-cx-str", float: "l1-cx-float", int: "l1-cx-int" }[tipo] || "l1-cx-outro");
  const cantoDoTipo = tipo => (tipo === "str" ? 12 : tipo === "float" || tipo === "int" ? 2 : 8);

  // estado: null (vazia) | { tipo, valor } | { erro: "SyntaxError" } | { nota: "texto" }
  function pintar(nome, estado) {
    const grupo = document.querySelector(`[data-l1-caixa="${nome}"]`);
    if (!grupo) return;
    const moldura = grupo.querySelector("rect");
    const tipo = grupo.querySelector("[data-l1-tipo]");
    const valor = grupo.querySelector("[data-l1-valor]");
    let classe = "l1-cx-vazia", canto = 8, rotulo = "?", conteudo = "(vazia)";
    if (estado?.erro) { classe = "l1-cx-erro"; rotulo = "✕"; conteudo = `✕ ${estado.erro}`; }
    else if (estado?.tipo) { classe = classeDoTipo(estado.tipo); canto = cantoDoTipo(estado.tipo); rotulo = estado.tipo; conteudo = curto(estado.valor); }
    else if (estado?.nota) { conteudo = estado.nota; }
    moldura.setAttribute("class", `l1-cx ${classe}`);
    moldura.setAttribute("rx", String(canto));
    tipo.textContent = rotulo;
    valor.textContent = conteudo;
  }

  function mostrarCodigo(v) {
    if (!codigo) return;
    const linhas = [
      `numero_processo = ${v.numero_processo || "?"}`,
      `nome_parte = ${v.nome_parte || "?"}`,
      `vara = ${v.vara || "?"}`,
      `valor_causa = ${v.valor_causa || "?"}`,
      `custas = valor_causa * ${v.taxa || "?"}`
    ];
    codigo.textContent = linhas.join("\n");
    if (conta) conta.textContent = `custas = valor_causa * ${v.taxa || "?"}`;
  }

  function avisar(texto, nivel) {
    if (!painel) return;
    painel.textContent = texto;
    if (nivel) painel.setAttribute("data-nivel", nivel);
    else painel.removeAttribute("data-nivel");
  }

  function gravarEvidencia(valida) {
    if (!oculto) return;
    const novo = valida ? "sim" : "";
    if (oculto.value === novo) return;
    oculto.value = novo;
    oculto.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // O painel mostra a mensagem real do Python e, ao lado, uma glosa em português: os nomes dos
  // erros só são ensinados no slide 9, e o estudante precisa entender o retorno já aqui.
  const GLOSA = {
    SyntaxError: "SyntaxError (erro de gramática: o Python nem começa a executar)",
    TypeError: "TypeError (erro de tipo: a operação não combina com o tipo do dado)"
  };
  function glosaMensagem(mensagem) {
    if (/leading zeros/.test(mensagem)) return " Em português: um número escrito sem aspas não pode começar com zero.";
    if (/can't multiply sequence/.test(mensagem)) return " Em português: um texto (\"sequence\") não se multiplica por decimal.";
    return "";
  }
  const ROTULO_CAMPO = { numero_processo: "numero_processo", nome_parte: "nome_parte", vara: "vara", valor_causa: "valor_causa" };
  function resumoCaixinhas(estados) {
    return Object.entries(estados).map(([nome, e]) => `${ROTULO_CAMPO[nome] || nome}: ${!e ? "vazia" : e.erro ? `✕ ${e.erro}` : e.tipo ? e.tipo : e.nota}`).join("; ");
  }

  function linhaIsolada(nome, escrita) {
    return (S?.oficina?.[nome] || []).find(item => item.escrita === escrita) || null;
  }

  function renderOficina() {
    const v = Object.fromEntries(ORDEM.map(nome => [nome, escolha(nome)]));
    mostrarCodigo(v);
    if (!S) {
      avisar("Os resultados executados não carregaram. Recarregue a página.", "atencao");
      gravarEvidencia(false);
      return;
    }
    const faltam = ORDEM.filter(nome => !v[nome]);
    if (faltam.length) {
      // Prévia honesta: cada linha escolhida avaliada sozinha. A célula inteira só roda com tudo escolhido.
      const estados = {};
      CAMPOS.forEach(nome => {
        const linha = v[nome] ? linhaIsolada(nome, v[nome]) : null;
        estados[nome] = !linha ? null : linha.erro ? { erro: linha.tipo_erro } : { tipo: linha.tipo, valor: v[nome] };
        pintar(nome, estados[nome]);
      });
      pintar("custas", null);
      // O estado de cada caixinha vai também em texto, para quem não vê a figura.
      avisar(`Faltam ${faltam.length} de 5 escolhas. Cada linha avaliada sozinha: ${resumoCaixinhas(estados)}. A célula inteira roda quando tudo estiver escolhido.`, null);
      gravarEvidencia(false);
      return;
    }

    const resultado = S.oficina_combos[JSON.stringify(ORDEM.map(nome => v[nome]))];
    if (!resultado) {
      avisar("Combinação sem resultado registrado. Recarregue a página.", "atencao");
      gravarEvidencia(false);
      return;
    }

    if (resultado.tipo_erro === "SyntaxError") {
      const culpada = LINHA_DA_VARIAVEL[resultado.linha];
      [...CAMPOS, "custas"].forEach(nome => pintar(nome, nome === culpada ? { erro: "SyntaxError" } : { nota: "não executada" }));
      const dica = resultado.linha === 5
        ? "Em Python, % não quer dizer “por cento”: é um sinal de conta (o resto da divisão), e 1% fica uma conta pela metade. Escreva a taxa como decimal: 1% = 0.01."
        : "Pergunta-chave: o que deveria ser texto e está sem a moldura das aspas?";
      avisar(`✕ ${GLOSA.SyntaxError} na linha ${resultado.linha}. O Python recusou a célula inteira: nenhuma caixinha foi criada. Última linha do erro: ${resultado.erro}.${glosaMensagem(resultado.erro)} ${dica}`, "risco");
      gravarEvidencia(false);
      return;
    }

    CAMPOS.forEach(nome => {
      const tipo = resultado.tipos[nome];
      pintar(nome, tipo ? { tipo, valor: resultado.valores[nome] } : { nota: "não executada" });
    });
    if (resultado.erro) {
      pintar("custas", { erro: resultado.tipo_erro });
      const tipoValor = resultado.tipos.valor_causa;
      let causa;
      if (tipoValor === "float") causa = "O valor da causa já é float. Quem virou texto foi a taxa: \"0.01\" entre aspas é texto. Tire as aspas da taxa.";
      else if (tipoValor === "tuple") causa = "O Python guardou valor_causa como tuple: um par de números, (15.4, 0), sem avisar. Para entrar na conta, o valor precisa ser float, escrito com ponto: 15400.00.";
      else causa = `O Python guardou valor_causa como ${tipoValor}: com aspas, é texto. Para entrar na conta, ele precisa ser float, sem aspas.`;
      avisar(`✕ As quatro primeiras linhas rodaram, mas a conta da linha ${resultado.linha} parou com ${GLOSA.TypeError}. Última linha do erro: ${resultado.erro}.${glosaMensagem(resultado.erro)} ${causa}`, "risco");
      gravarEvidencia(false);
      return;
    }
    pintar("custas", { tipo: resultado.tipos.custas, valor: resultado.valores.custas });

    const tiposCertos = CAMPOS.map(nome => resultado.tipos[nome]).join(",") === "str,str,str,float";
    const custasCertas = resultado.valores.custas === "154.0";
    if (tiposCertos && custasCertas) {
      avisar("✓ A célula rodou inteira: três caixinhas de texto (str), o valor da causa como decimal (float) e custas = 154.0. É a ficha que a Dalva vai usar em todo o curso.", "correto");
      gravarEvidencia(true);
    } else {
      avisar(`▲ A célula rodou, mas a ficha ainda não está certa: tipos ${CAMPOS.map(nome => `${nome}=${resultado.tipos[nome]}`).join(", ")}; custas = ${resultado.valores.custas}.`, "atencao");
      gravarEvidencia(false);
    }
  }

  selects.forEach(select => {
    select.addEventListener("change", renderOficina);
    select.addEventListener("input", renderOficina);
  });
  renderOficina();

  /* ---------------- Vídeo ---------------- */
  document.querySelectorAll("[data-video-id]").forEach(caixa => {
    const id = (caixa.dataset.videoId || "").trim();
    const botao = caixa.querySelector("[data-video-play]");
    const estado = caixa.querySelector("[data-video-estado]");
    const quadro = caixa.querySelector("[data-video-quadro]");
    const linhaLink = document.querySelector("[data-video-link-linha]");
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
      if (botao) { botao.disabled = true; botao.textContent = "Vídeo em produção"; }
      return;
    }
    const assistir = `https://www.youtube.com/watch?v=${id}`;
    if (linhaLink) {
      linhaLink.textContent = "Link direto do vídeo: ";
      const a = document.createElement("a");
      a.href = assistir; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = "abrir no YouTube (nova janela)";
      linhaLink.append(a);
    }
    if (estado) estado.textContent = "O player do YouTube só é carregado quando você clica. Se a rede bloquear o YouTube, use a transcrição ou o link direto em outra rede.";
    botao?.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
      iframe.title = `Vídeo: ${caixa.dataset.videoTitulo || "vídeo da lição"}`;
      iframe.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      quadro.replaceChildren(iframe);
      botao.hidden = true;
      if (estado) estado.textContent = "Player carregado. Se ele não abrir, use o link direto ou a transcrição.";
      iframe.focus();
    });
  });

  /* ---------------- Limite: 48 variáveis soltas ---------------- */
  const grade = document.querySelector("[data-l1-grade]");
  const legenda = document.querySelector("[data-l1-grade-legenda]");
  const resultadoLimite = document.querySelector('[data-demo-result="limite"]');
  const totalBase = Array.isArray(window.PROCESSOS) ? window.PROCESSOS.length : 36;
  const PAUTA = 12;
  let quantos = PAUTA;

  function renderGrade() {
    if (!grade) return;
    const linhas = [];
    for (let i = 1; i <= quantos; i += 1) {
      const linha = document.createElement("div");
      linha.className = "l1-grade-linha";
      CAMPOS.forEach(nome => {
        const celula = document.createElement("span");
        celula.textContent = `${nome}_${i}`;
        if (nome === "valor_causa") celula.className = "l1-g-float";
        linha.append(celula);
      });
      linhas.push(linha);
    }
    grade.replaceChildren(...linhas);
    const total = quantos * CAMPOS.length;
    const frase = `${quantos} ${quantos === 1 ? "processo" : "processos"} × 4 campos = ${total} variáveis soltas.`;
    if (resultadoLimite) resultadoLimite.textContent = quantos === PAUTA ? `${frase} É a pauta da semana.` : frase;
    if (legenda) legenda.textContent = `${quantos} ${quantos === 1 ? "processo" : "processos"}, 4 variáveis soltas por processo: ${total} caixinhas, de numero_processo_1 a valor_causa_${quantos}.`;
  }
  document.querySelector('[data-demo="limite-mais"]')?.addEventListener("click", () => {
    quantos = Math.min(quantos + 1, totalBase);
    renderGrade();
  });
  document.querySelector('[data-demo="limite-volta"]')?.addEventListener("click", () => {
    quantos = 1;
    renderGrade();
  });
  renderGrade();

  /* ---------------- Copiar o código do Colab ---------------- */
  document.querySelectorAll("[data-l1-copiar]").forEach(botao => {
    botao.addEventListener("click", async () => {
      const texto = document.getElementById(botao.dataset.l1Copiar)?.textContent || "";
      try {
        await navigator.clipboard.writeText(texto);
        botao.textContent = "Copiado";
        botao.classList.add("copiado");
      } catch (erro) {
        botao.textContent = "Selecione e copie";
      }
      setTimeout(() => { botao.textContent = "Copiar"; botao.classList.remove("copiado"); }, 1800);
    });
  });

  /* ---------------- Limpeza confirmada pelo runtime ---------------- */
  document.addEventListener("respostaslimpas", () => {
    selects.forEach(select => { select.value = ""; });
    renderOficina();
    quantos = PAUTA;
    renderGrade();
  });
}());
