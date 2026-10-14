/* =========================================================
   DESAFIO ANIME I GEEK
   Arquivo principal da interface pública

   Funcionalidades:
   - Contagem regressiva para domingo às 22h
   - Grade demonstrativa de 1.000 números
   - Paginação
   - Pesquisa de números
   - Filtros de visualização
   - Indicadores da interface
   - Notificações toast

   IMPORTANTE:
   Esta versão cuida da interface.
   A emissão real de bilhetes, as reservas globais,
   o fechamento da edição, o sorteio e os valores
   financeiros dependem da integração segura com Firebase.
========================================================= */

const DesafioAnimeIGeek = (() => {
  'use strict';

  /* =======================================================
     1. CONFIGURAÇÕES
  ======================================================= */

  const CONFIG = {
    totalNumeros: 1000,
    numerosPorPagina: 100,
    diaFechamento: 0, // Domingo
    horaFechamento: 22,
    minutoFechamento: 0,

    // Sem backend conectado, os números são apenas demonstração.
    modoDemonstracao: true
  };

  const state = {
    paginaAtual: 1,
    pesquisa: '',
    filtro: 'todos',
    numerosSelecionados: new Set(),
    numeros: [],
    temporizador: null
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
      elemento.textContent = texto;
    }
  }

  function definirHTML(id, html) {
    const elemento = obterElemento(id);

    if (elemento) {
      elemento.innerHTML = html;
    }
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  function formatarNumero(numero) {
    return new Intl.NumberFormat('pt-BR').format(numero);
  }

  function escaparHTML(valor) {
    return String(valor)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function limitarNumero(numero, minimo, maximo) {
    return Math.min(Math.max(numero, minimo), maximo);
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
      'profileAction',
      'searchNumber',
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
      'toast'
    ];

    ids.forEach(id => {
      elementos[id] = obterElemento(id);
    });
  }

  /* =======================================================
     4. INICIALIZAÇÃO DOS NÚMEROS DEMONSTRATIVOS
  ======================================================= */

  function inicializarNumeros() {
    state.numeros = Array.from(
      { length: CONFIG.totalNumeros },
      (_, indice) => ({
        numero: indice + 1,
        status: 'disponivel'
      })
    );

    renderizarGrade();
    atualizarResumoGrade();
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

    /*
      Se já for domingo e o horário de fechamento passou,
      a contagem aponta para o domingo seguinte.

      O estado oficial de uma edição deverá vir do servidor.
    */

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
     6. ESTADO VISUAL DA EDIÇÃO
  ======================================================= */

  function configurarEstadoInicial() {
    definirTexto('editionStatus', 'Interface demonstrativa');
    definirTexto('editionTag', 'Edição de demonstração');

    const indicador = obterElemento('liveDot');

    if (indicador) {
      indicador.classList.remove('status-live');
      indicador.setAttribute('aria-label', 'Modo de demonstração');
      indicador.title = 'Modo de demonstração';
    }

    const avisoFechamento = obterElemento('closedBanner');

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
    definirTexto('totalNumbers', formatarNumero(CONFIG.totalNumeros));
    definirTexto('availableNote', 'Disponibilidade ainda não confirmada');

    definirTexto('myNumbers', '0');
    definirTexto('ticketCount', '0');

    definirTexto(
      'ticketDescription',
      'A emissão de bilhetes será ativada após a integração com o servidor.'
    );

    definirTexto(
      'numberDescription',
      'Grade demonstrativa. A disponibilidade real depende da conexão com o servidor.'
    );

    definirTexto(
      'carryoverValue',
      'Não calculado'
    );

    definirTexto(
      'carryoverDescription',
      'Informações financeiras serão exibidas após a configuração do sistema.'
    );

    definirTexto(
      'regulationStatus',
      'Regulamento e requisitos legais precisam ser validados antes do lançamento.'
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

    if (state.filtro === 'disponiveis') {
      numeros = numeros.filter(
        item => item.status === 'disponivel'
      );
    }

    return numeros;
  }

  function obterTotalPaginas(numeros) {
    return Math.max(
      1,
      Math.ceil(numeros.length / CONFIG.numerosPorPagina)
    );
  }

  /* =======================================================
     8. GERAÇÃO DA GRADE
  ======================================================= */

  function renderizarGrade() {
    const grade = obterElemento('numberGrid');

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
      grade.innerHTML = `
        <div class="number-grid-empty">
          <strong>Nenhum número encontrado.</strong>
          <p class="mt-1">
            Verifique a pesquisa ou altere o filtro.
          </p>
        </div>
      `;

      atualizarPaginacao(0, 0);
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
        `Número ${item.numero}. Disponibilidade não confirmada.`
      );

      botao.title =
        'Demonstração visual: número ainda não reservado no servidor.';

      /*
        A seleção serve apenas para demonstrar a interface.
        Ela não reserva o número globalmente e não concede
        participação no desafio.
      */

      if (state.numerosSelecionados.has(item.numero)) {
        botao.classList.add('selected');
        botao.setAttribute('aria-pressed', 'true');
      } else {
        botao.setAttribute('aria-pressed', 'false');
      }

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
     9. SELEÇÃO VISUAL DE NÚMEROS
  ======================================================= */

  function selecionarNumero(numero) {
    if (!CONFIG.modoDemonstracao) {
      mostrarToast(
        'A seleção de números precisa ser validada pelo servidor.',
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
        `Número ${numero} selecionado para demonstração.`,
        'success'
      );
    }

    /*
      Não usamos localStorage para transformar a seleção
      em participação oficial. Os dados ficam somente
      na memória desta página.
    */

    renderizarGrade();
    atualizarResumoGrade();
  }

  /* =======================================================
     10. PAGINAÇÃO
  ======================================================= */

  function atualizarPaginacao(totalResultados, totalPaginas) {
    const indicador = obterElemento('pageIndicator');
    const anterior = obterElemento('previousPage');
    const proximo = obterElemento('nextPage');

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
      proximo.disabled = state.paginaAtual >= totalPaginas;
      proximo.setAttribute(
        'aria-label',
        'Ir para a próxima página'
      );
    }

    definirTexto(
      'gridSummary',
      `${formatarNumero(totalResultados)} números na visualização`
    );
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

  function atualizarResumoGrade() {
    definirTexto(
      'myNumbers',
      String(state.numerosSelecionados.size)
    );

    definirTexto(
      'gridSummary',
      `${formatarNumero(state.numerosSelecionados.size)} selecionados nesta demonstração`
    );

    const limpar = obterElemento('clearSearch');

    if (limpar) {
      limpar.hidden =
        state.pesquisa.length === 0 &&
        state.filtro === 'todos' &&
        state.numerosSelecionados.size === 0;
    }
  }

  /* =======================================================
     12. PESQUISA
  ======================================================= */

  function configurarPesquisa() {
    const campo = obterElemento('searchNumber');

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
    /*
      Se o HTML tiver um seletor com id="numberFilter",
      este código ativará os filtros correspondentes.
    */

    const filtro = obterElemento('numberFilter');

    if (!filtro) {
      return;
    }

    filtro.addEventListener('change', evento => {
      const valor = evento.target.value;

      const filtrosPermitidos = [
        'todos',
        'disponiveis',
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
     14. LIMPAR PESQUISA E SELEÇÃO
  ======================================================= */

  function limparFiltros() {
    state.pesquisa = '';
    state.filtro = 'todos';
    state.paginaAtual = 1;

    const campo = obterElemento('searchNumber');

    if (campo) {
      campo.value = '';
    }

    const filtro = obterElemento('numberFilter');

    if (filtro) {
      filtro.value = 'todos';
    }

    state.numerosSelecionados.clear();

    renderizarGrade();
    atualizarResumoGrade();

    mostrarToast(
      'Pesquisa e seleção visual limpas.',
      'info'
    );
  }

  /* =======================================================
     15. NOTIFICAÇÕES TOAST
  ======================================================= */

  function mostrarToast(mensagem, tipo = 'info') {
    const container = obterElemento('toast');

    if (!container) {
      console.info(`[Desafio Anime i Geek] ${mensagem}`);
      return;
    }

    const toast = document.createElement('div');

    toast.className = 'toast';

    if (tipo === 'success') {
      toast.classList.add('success');
    } else if (tipo === 'error') {
      toast.classList.add('error');
    } else if (tipo === 'warning') {
      toast.classList.add('warning');
    }

    const icone = document.createElement('span');
    icone.className = 'toast-icon';

    if (tipo === 'success') {
      icone.textContent = '✓';
    } else if (tipo === 'error') {
      icone.textContent = '!';
    } else if (tipo === 'warning') {
      icone.textContent = '⚠';
    } else {
      icone.textContent = 'i';
    }

    const texto = document.createElement('span');
    texto.className = 'toast-message';
    texto.textContent = mensagem;

    toast.append(icone, texto);

    /*
      O HTML pode conter um elemento #toast.
      Se ele for o próprio container de notificações,
      as mensagens serão inseridas nele.
    */

    container.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add('toast-leave');

      window.setTimeout(() => {
        toast.remove();
      }, 200);
    }, 3500);
  }

  /* =======================================================
     16. AÇÕES QUE AINDA DEPENDEM DO BACKEND
  ======================================================= */

  function configurarAcoesPendentes() {
    const perfil = obterElemento('profileAction');

    if (perfil) {
      perfil.addEventListener('click', evento => {
        evento.preventDefault();

        mostrarToast(
          'O acesso ao perfil será habilitado após a configuração da autenticação.',
          'warning'
        );
      });
    }

    /*
      Não simulamos visualização de anúncios, receita,
      pagamento ou emissão de bilhetes.

      Essas ações só devem ser habilitadas depois que
      o sistema estiver conectado ao Firebase e as
      operações forem validadas no servidor.
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
          'A emissão de bilhetes ainda não está ativa. A integração segura com o servidor é necessária.',
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

      if (digitando) {
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
    const anterior = obterElemento('previousPage');
    const proximo = obterElemento('nextPage');
    const limpar = obterElemento('clearSearch');

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
     19. ATUALIZAÇÃO DO ANO NO RODAPÉ
  ======================================================= */

  function atualizarAnoRodape() {
    const ano = obterElemento('currentYear');

    if (ano) {
      ano.textContent = String(new Date().getFullYear());
    }
  }

  /* =======================================================
     20. INICIALIZAÇÃO GERAL
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
      '[Desafio Anime i Geek] Modo de demonstração: os números não estão reservados no servidor.'
    );
  }

  /* =======================================================
     21. API INTERNA
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
