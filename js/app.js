/* =========================================================
   DESAFIO ANIME I GEEK
   Arquivo principal da interface pública

   FUNCIONALIDADES
   - Contagem regressiva para domingo às 22h
   - Grade demonstrativa com 1.000 números
   - Paginação
   - Pesquisa de números
   - Filtros de visualização, quando disponíveis no HTML
   - Seleção visual de números
   - Resumo da grade
   - Notificações toast
   - Compatibilidade com os elementos do index.html

   IMPORTANTE
   Esta versão gerencia somente a interface pública.

   Não realiza:
   - Reservas reais de números
   - Emissão de bilhetes
   - Pagamentos
   - Registro de receitas
   - Sorteios oficiais
   - Confirmação de participação

   Essas operações exigem integração segura com o servidor.
========================================================= */

const DesafioAnimeIGeek = (() => {
  'use strict';

  /* =======================================================
     1. CONFIGURAÇÕES
  ======================================================= */

  const CONFIG = Object.freeze({
    totalNumeros: 1000,
    numerosPorPagina: 100,

    diaFechamento: 0, // Domingo
    horaFechamento: 22,
    minutoFechamento: 0,

    modoDemonstracao: true,
    duracaoToast: 3500
  });

  const state = {
    paginaAtual: 1,
    pesquisa: '',
    filtro: 'todos',

    // Seleção temporária, mantida apenas na memória.
    numerosSelecionados: new Set(),

    numeros: [],
    temporizador: null,
    toastTemporizador: null
  };

  const elementos = {};

  /* =======================================================
     2. UTILITÁRIOS
  ======================================================= */

  function obterElemento(id) {
    return document.getElementById(id);
  }

  function definirTexto(id, texto) {
    const elemento = obterElemento(id);

    if (elemento) {
      elemento.textContent = String(texto);
    }
  }

  function formatarNumero(numero) {
    return new Intl.NumberFormat('pt-BR').format(numero);
  }

  function limitarNumero(numero, minimo, maximo) {
    return Math.min(Math.max(numero, minimo), maximo);
  }

  function obterElementoSeguro(id) {
    return elementos[id] || obterElemento(id);
  }

  /* =======================================================
     3. REFERÊNCIAS AOS ELEMENTOS HTML
  ======================================================= */

  function carregarElementos() {
    const ids = [
      'liveDot',
      'editionStatus',

      'days',
      'hours',
      'minutes',
      'seconds',
      'deadlineText',
      'closedBanner',

      'accumulatedValue',
      'accumulatedDescription',

      'participants',
      'totalNumbers',
      'availableNote',
      'myNumbers',

      'editionTag',
      'ticketCount',
      'ticketDescription',

      'profileButton',
      'profileAction',

      'searchNumber',
      'numberFilter',
      'numberDescription',
      'numberGrid',

      'previousPage',
      'pageIndicator',
      'nextPage',
      'gridSummary',
      'clearSearch',

      'resultsContainer',

      'prizeList',
      'carryoverValue',
      'carryoverDescription',
      'activityList',

      'regulationStatus',
      'currentYear',

      'toast'
    ];

    ids.forEach(id => {
      elementos[id] = obterElemento(id);
    });
  }

  /* =======================================================
     4. INICIALIZAÇÃO DOS NÚMEROS
  ======================================================= */

  function inicializarNumeros() {
    state.numeros = Array.from(
      { length: CONFIG.totalNumeros },
      (_, indice) => ({
        numero: indice + 1,
        status: 'demonstracao'
      })
    );

    renderizarGrade();
  }

  /* =======================================================
     5. CONTAGEM REGRESSIVA
  ======================================================= */

  function obterProximoFechamento() {
    const agora = new Date();
    const fechamento = new Date(agora);

    fechamento.setHours(
      CONFIG.horaFechamento,
      CONFIG.minutoFechamento,
      0,
      0
    );

    let diasAteDomingo =
      (CONFIG.diaFechamento - agora.getDay() + 7) % 7;

    // Se domingo às 22h já passou, aponta para o próximo domingo.
    if (diasAteDomingo === 0 && agora >= fechamento) {
      diasAteDomingo = 7;
    }

    fechamento.setDate(
      agora.getDate() + diasAteDomingo
    );

    return fechamento;
  }

  function atualizarContagemRegressiva() {
    const agora = new Date();
    const fechamento = obterProximoFechamento();

    const diferenca = Math.max(
      0,
      fechamento.getTime() - agora.getTime()
    );

    const totalSegundos = Math.floor(diferenca / 1000);

    const dias = Math.floor(totalSegundos / 86400);
    const horas = Math.floor((totalSegundos % 86400) / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    definirTexto('days', String(dias).padStart(2, '0'));
    definirTexto('hours', String(horas).padStart(2, '0'));
    definirTexto('minutes', String(minutos).padStart(2, '0'));
    definirTexto('seconds', String(segundos).padStart(2, '0'));

    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(fechamento);

    definirTexto(
      'deadlineText',
      `Próximo fechamento previsto: ${dataFormatada}.`
    );
  }

  function iniciarContagemRegressiva() {
    atualizarContagemRegressiva();

    if (state.temporizador) {
      clearInterval(state.temporizador);
    }

    state.temporizador = setInterval(
      atualizarContagemRegressiva,
      1000
    );
  }

  /* =======================================================
     6. ESTADO INICIAL DA INTERFACE
  ======================================================= */

  function configurarEstadoInicial() {
    definirTexto(
      'editionStatus',
      'Interface demonstrativa'
    );

    definirTexto(
      'editionTag',
      'Edição de demonstração'
    );

    const indicador = obterElementoSeguro('liveDot');

    if (indicador) {
      indicador.classList.remove('status-live');

      indicador.setAttribute(
        'aria-label',
        'Modo de demonstração'
      );

      indicador.title = 'Modo de demonstração';
    }

    const avisoFechamento = obterElementoSeguro('closedBanner');

    if (avisoFechamento) {
      avisoFechamento.hidden = true;
    }

    definirTexto(
      'accumulatedValue',
      'Aguardando conexão'
    );

    definirTexto(
      'accumulatedDescription',
      'O valor oficial será exibido após a integração financeira segura.'
    );

    definirTexto('participants', '—');

    definirTexto(
      'totalNumbers',
      formatarNumero(CONFIG.totalNumeros)
    );

    definirTexto(
      'availableNote',
      'Disponibilidade não confirmada'
    );

    definirTexto('myNumbers', '0');
    definirTexto('ticketCount', '0');

    definirTexto(
      'ticketDescription',
      'A emissão de bilhetes será ativada após a integração segura com o servidor.'
    );

    definirTexto(
      'numberDescription',
      'Grade demonstrativa. A disponibilidade real dos números não está confirmada.'
    );

    definirTexto(
      'carryoverValue',
      'Não calculado'
    );

    definirTexto(
      'carryoverDescription',
      'As informações financeiras serão exibidas após a configuração do sistema.'
    );

    definirTexto(
      'regulationStatus',
      'O regulamento e os requisitos legais precisam ser validados antes do lançamento.'
    );
  }

  /* =======================================================
     7. PESQUISA E FILTROS
  ======================================================= */

  function obterNumerosFiltrados() {
    let numeros = [...state.numeros];

    if (state.pesquisa.trim() !== '') {
      const termo = state.pesquisa.trim();

      if (!/^\d+$/.test(termo)) {
        return [];
      }

      const numeroPesquisado = Number(termo);

      numeros = numeros.filter(
        item => item.numero === numeroPesquisado
      );
    }

    if (state.filtro === 'selecionados') {
      numeros = numeros.filter(
        item => state.numerosSelecionados.has(item.numero)
      );
    }

    /*
      Não existe filtro de disponibilidade real neste modo.
      Os números apresentados são apenas demonstrativos.
    */

    return numeros;
  }

  function obterTotalPaginas(numeros) {
    return Math.max(
      1,
      Math.ceil(numeros.length / CONFIG.numerosPorPagina)
    );
  }

  /* =======================================================
     8. RENDERIZAÇÃO DA GRADE
  ======================================================= */

  function renderizarGrade() {
    const grade = obterElementoSeguro('numberGrid');

    if (!grade) {
      return;
    }

    const numerosFiltrados = obterNumerosFiltrados();
    const totalPaginas = obterTotalPaginas(numerosFiltrados);

    state.paginaAtual = limitarNumero(
      state.paginaAtual,
      1,
      totalPaginas
    );

    const inicio =
      (state.paginaAtual - 1) * CONFIG.numerosPorPagina;

    const numerosDaPagina = numerosFiltrados.slice(
      inicio,
      inicio + CONFIG.numerosPorPagina
    );

    if (numerosDaPagina.length === 0) {
      const mensagem = document.createElement('div');

      mensagem.className = 'number-grid-empty';

      const titulo = document.createElement('strong');
      titulo.textContent = 'Nenhum número encontrado.';

      const descricao = document.createElement('p');
      descricao.className = 'mt-1';
      descricao.textContent =
        'Verifique a pesquisa ou altere o filtro.';

      mensagem.append(titulo, descricao);
      grade.replaceChildren(mensagem);

      atualizarPaginacao(
        numerosFiltrados.length,
        totalPaginas
      );

      atualizarResumoGrade();

      return;
    }

    const fragmento = document.createDocumentFragment();

    numerosDaPagina.forEach(item => {
      const botao = document.createElement('button');

      botao.type = 'button';
      botao.className = 'number-button available';

      botao.textContent = String(item.numero).padStart(3, '0');

      botao.dataset.number = String(item.numero);

      botao.setAttribute(
        'aria-label',
        `Número ${item.numero}. Demonstração, sem reserva confirmada.`
      );

      botao.title =
        'Demonstração visual: este número não está reservado no servidor.';

      const selecionado =
        state.numerosSelecionados.has(item.numero);

      if (selecionado) {
        botao.classList.add('selected');
      }

      botao.setAttribute(
        'aria-pressed',
        String(selecionado)
      );

      botao.addEventListener('click', () => {
        selecionarNumero(item.numero);
      });

      fragmento.appendChild(botao);
    });

    grade.replaceChildren(fragmento);

    atualizarPaginacao(
      numerosFiltrados.length,
      totalPaginas
    );

    atualizarResumoGrade();
  }

  /* =======================================================
     9. SELEÇÃO VISUAL
  ======================================================= */

  function selecionarNumero(numero) {
    if (!CONFIG.modoDemonstracao) {
      mostrarToast(
        'A seleção precisa ser validada pelo servidor.',
        'warning'
      );

      return;
    }

    if (state.numerosSelecionados.has(numero)) {
      state.numerosSelecionados.delete(numero);

      mostrarToast(
        `Número ${numero} removido da seleção visual.`,
        'info'
      );
    } else {
      state.numerosSelecionados.add(numero);

      mostrarToast(
        `Número ${numero} selecionado apenas para demonstração.`,
        'success'
      );
    }

    renderizarGrade();
  }

  /* =======================================================
     10. PAGINAÇÃO
  ======================================================= */

  function atualizarPaginacao(
    totalResultados,
    totalPaginas
  ) {
    const indicador = obterElementoSeguro('pageIndicator');
    const anterior = obterElementoSeguro('previousPage');
    const proximo = obterElementoSeguro('nextPage');

    if (indicador) {
      indicador.textContent =
        `${state.paginaAtual} / ${totalPaginas}`;
    }

    if (anterior) {
      anterior.disabled = state.paginaAtual <= 1;

      anterior.setAttribute(
        'aria-label',
        'Ir para a página anterior'
      );
    }

    if (proximo) {
      proximo.disabled =
        state.paginaAtual >= totalPaginas;

      proximo.setAttribute(
        'aria-label',
        'Ir para a próxima página'
      );
    }

    /*
      O resumo principal é atualizado em uma única função,
      evitando que o texto seja sobrescrito por outra rotina.
    */

    atualizarResumoGrade(totalResultados);
  }

  function irParaPaginaAnterior() {
    if (state.paginaAtual > 1) {
      state.paginaAtual--;
      renderizarGrade();
    }
  }

  function irParaProximaPagina() {
    const numeros = obterNumerosFiltrados();
    const totalPaginas = obterTotalPaginas(numeros);

    if (state.paginaAtual < totalPaginas) {
      state.paginaAtual++;
      renderizarGrade();
    }
  }

  /* =======================================================
     11. RESUMO DA GRADE
  ======================================================= */

  function atualizarResumoGrade(totalResultados) {
    definirTexto(
      'myNumbers',
      String(state.numerosSelecionados.size)
    );

    const numerosFiltrados =
      obterNumerosFiltrados();

    const total = Number.isFinite(totalResultados)
      ? totalResultados
      : numerosFiltrados.length;

    let resumo =
      `${formatarNumero(total)} números na visualização`;

    if (state.numerosSelecionados.size > 0) {
      resumo +=
        ` · ${formatarNumero(state.numerosSelecionados.size)} selecionados para demonstração`;
    }

    definirTexto('gridSummary', resumo);

    const limpar = obterElementoSeguro('clearSearch');

    if (limpar) {
      limpar.hidden =
        state.pesquisa.length === 0 &&
        state.filtro === 'todos';
    }
  }

  /* =======================================================
     12. PESQUISA
  ======================================================= */

  function configurarPesquisa() {
    const campo = obterElementoSeguro('searchNumber');

    if (!campo) {
      return;
    }

    campo.addEventListener('input', evento => {
      state.pesquisa = evento.target.value;
      state.paginaAtual = 1;

      renderizarGrade();
    });

    campo.addEventListener('keydown', evento => {
      if (evento.key === 'Escape') {
        campo.value = '';
        state.pesquisa = '';
        state.paginaAtual = 1;

        renderizarGrade();
      }
    });
  }

  /* =======================================================
     13. FILTROS
  ======================================================= */

  function configurarFiltros() {
    const filtro = obterElementoSeguro('numberFilter');

    if (!filtro) {
      return;
    }

    filtro.addEventListener('change', evento => {
      const valor = evento.target.value;

      const filtrosPermitidos = [
        'todos',
        'selecionados'
      ];

      state.filtro = filtrosPermitidos.includes(valor)
        ? valor
        : 'todos';

      state.paginaAtual = 1;

      renderizarGrade();
    });
  }

  /* =======================================================
     14. LIMPAR PESQUISA E FILTROS
  ======================================================= */

  function limparFiltros() {
    state.pesquisa = '';
    state.filtro = 'todos';
    state.paginaAtual = 1;

    const campo = obterElementoSeguro('searchNumber');

    if (campo) {
      campo.value = '';
    }

    const filtro = obterElementoSeguro('numberFilter');

    if (filtro) {
      filtro.value = 'todos';
    }

    /*
      A seleção visual é preservada.
      Limpar a pesquisa não deve apagar os números selecionados.
    */

    renderizarGrade();

    mostrarToast(
      'Pesquisa e filtros limpos.',
      'info'
    );
  }

  /* =======================================================
     15. NOTIFICAÇÕES TOAST
  ======================================================= */

  function mostrarToast(
    mensagem,
    tipo = 'info'
  ) {
    const container = obterElementoSeguro('toast');

    if (!container) {
      console.info(
        `[Desafio Anime i Geek] ${mensagem}`
      );

      return;
    }

    /*
      No HTML atual, #toast é o próprio elemento da notificação.
      Portanto, não criamos outro toast dentro dele.
    */

    if (state.toastTemporizador) {
      clearTimeout(state.toastTemporizador);
      state.toastTemporizador = null;
    }

    container.className = 'toast';

    if (tipo === 'success') {
      container.classList.add('success');
    } else if (tipo === 'error') {
      container.classList.add('error');
    } else if (tipo === 'warning') {
      container.classList.add('warning');
    }

    const icones = {
      success: '✓',
      error: '!',
      warning: '⚠',
      info: 'i'
    };

    const icone = icones[tipo] || icones.info;

    container.replaceChildren();

    const iconeElemento = document.createElement('span');
    iconeElemento.className = 'toast-icon';
    iconeElemento.setAttribute('aria-hidden', 'true');
    iconeElemento.textContent = icone;

    const textoElemento = document.createElement('span');
    textoElemento.className = 'toast-message';
    textoElemento.textContent = mensagem;

    container.append(
      iconeElemento,
      textoElemento
    );

    container.hidden = false;
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');

    container.classList.remove('toast-leave');

    state.toastTemporizador = window.setTimeout(() => {
      container.classList.add('toast-leave');

      state.toastTemporizador = window.setTimeout(() => {
        container.replaceChildren();
        container.hidden = true;
        container.classList.remove(
          'success',
          'error',
          'warning',
          'toast-leave'
        );

        state.toastTemporizador = null;
      }, 200);
    }, CONFIG.duracaoToast);
  }

  /* =======================================================
     16. AÇÕES PENDENTES DE INTEGRAÇÃO
  ======================================================= */

  function configurarAcoesPendentes() {
    const perfil = obterElementoSeguro('profileAction');

    if (perfil) {
      perfil.addEventListener('click', evento => {
        evento.preventDefault();

        mostrarToast(
          'O acesso ao perfil será habilitado após a configuração da autenticação.',
          'warning'
        );
      });
    }

    const perfilBotao = obterElementoSeguro('profileButton');

    if (perfilBotao) {
      perfilBotao.addEventListener('click', evento => {
        evento.preventDefault();

        mostrarToast(
          'A autenticação de usuários ainda não está configurada.',
          'warning'
        );
      });
    }

    /*
      Nenhum anúncio é considerado assistido.
      Nenhum bilhete é emitido por esta versão.
    */

    const botoesDeBilhetes = document.querySelectorAll(
      '[data-action="earn-ticket"], ' +
      '[data-action="watch-ad"], ' +
      '[data-action="claim-ticket"]'
    );

    botoesDeBilhetes.forEach(botao => {
      botao.addEventListener('click', evento => {
        evento.preventDefault();

        mostrarToast(
          'A emissão de bilhetes ainda não está ativa. É necessária uma integração segura com o servidor.',
          'warning'
        );
      });
    });
  }

  /* =======================================================
     17. ATALHOS DE TECLADO
  ======================================================= */

  function configurarTeclado() {
    document.addEventListener('keydown', evento => {
      const elementoAtivo = document.activeElement;

      const digitando =
        elementoAtivo &&
        (
          elementoAtivo.tagName === 'INPUT' ||
          elementoAtivo.tagName === 'TEXTAREA' ||
          elementoAtivo.tagName === 'SELECT' ||
          elementoAtivo.isContentEditable
        );

      if (digitando || evento.altKey || evento.ctrlKey ||
          evento.metaKey) {
        return;
      }

      if (evento.key === 'ArrowLeft') {
        irParaPaginaAnterior();
      }

      if (evento.key === 'ArrowRight') {
        irParaProximaPagina();
      }
    });
  }

  /* =======================================================
     18. CONFIGURAÇÃO DOS BOTÕES
  ======================================================= */

  function configurarBotoes() {
    const anterior = obterElementoSeguro('previousPage');
    const proximo = obterElementoSeguro('nextPage');
    const limpar = obterElementoSeguro('clearSearch');

    if (anterior) {
      anterior.addEventListener(
        'click',
        irParaPaginaAnterior
      );
    }

    if (proximo) {
      proximo.addEventListener(
        'click',
        irParaProximaPagina
      );
    }

    if (limpar) {
      limpar.addEventListener(
        'click',
        limparFiltros
      );
    }
  }

  /* =======================================================
     19. ANO DO RODAPÉ
  ======================================================= */

  function atualizarAnoRodape() {
    definirTexto(
      'currentYear',
      new Date().getFullYear()
    );
  }

  /* =======================================================
     20. INICIALIZAÇÃO
  ======================================================= */

  function iniciar() {
    carregarElementos();

    configurarEstadoInicial();

    inicializarNumeros();

    iniciarContagemRegressiva();

    configurarPesquisa();

    configurarFiltros();

    configurarBotoes();

    configurarAcoesPendentes();

    configurarTeclado();

    atualizarAnoRodape();

    console.info(
      '[Desafio Anime i Geek] Interface inicializada.'
    );

    console.info(
      '[Desafio Anime i Geek] Modo de demonstração ativo.'
    );

    console.info(
      '[Desafio Anime i Geek] Os números não estão reservados e a seleção não gera participação oficial.'
    );
  }

  /* =======================================================
     21. API PÚBLICA DO MÓDULO
  ======================================================= */

  return {
    iniciar,
    mostrarToast,
    renderizarGrade,
    limparFiltros
  };
})();

/* =========================================================
   EXECUÇÃO
========================================================= */

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    DesafioAnimeIGeek.iniciar,
    { once: true }
  );
} else {
  DesafioAnimeIGeek.iniciar();
}
