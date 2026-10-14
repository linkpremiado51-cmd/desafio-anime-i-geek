/* =========================================================
   DESAFIO ANIME I GEEK
   Arquivo: js/admin.js

   Responsabilidades:
   - Controlar a autenticação administrativa
   - Verificar a permissão de administrador
   - Proteger visualmente o painel
   - Carregar informações da edição
   - Consultar resultados
   - Encerrar sessões
   - Exibir notificações

   SEGURANÇA:
   A interface não substitui as regras do Firestore.
   A autorização definitiva deve ser validada no servidor.
========================================================= */

import {
  firebaseDisponivel,
  verificarConfiguracao,
  observarUsuario,
  entrarComEmail,
  sairDaConta,
  obterEdicao,
  obterResultado
} from './firebase.js';

/* =========================================================
   1. ESTADO DO PAINEL
========================================================= */

const AdminDesafio = (() => {
  'use strict';

  const state = {
    usuario: null,
    autorizado: false,
    carregando: false,
    edicao: null,
    resultado: null,
    cancelarObservador: null
  };

  /* =======================================================
     2. UTILITÁRIOS
  ======================================================= */

  function elemento(id) {
    return document.getElementById(id);
  }

  function texto(id, valor) {
    const campo = elemento(id);

    if (campo) {
      campo.textContent = valor;
    }
  }

  function mostrar(id) {
    const campo = elemento(id);

    if (campo) {
      campo.hidden = false;
    }
  }

  function ocultar(id) {
    const campo = elemento(id);

    if (campo) {
      campo.hidden = true;
    }
  }

  function formatarMoeda(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return 'Não disponível';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numero);
  }

  function formatarData(valor) {
    if (!valor) {
      return 'Não informada';
    }

    let data;

    if (typeof valor.toDate === 'function') {
      data = valor.toDate();
    } else if (valor instanceof Date) {
      data = valor;
    } else {
      data = new Date(valor);
    }

    if (Number.isNaN(data.getTime())) {
      return 'Data inválida';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(data);
  }

  /* =======================================================
     3. NOTIFICAÇÕES
  ======================================================= */

  function notificar(mensagem, tipo = 'info') {
    const container =
      elemento('adminToast') ||
      elemento('toast');

    if (!container) {
      console.info(
        `[Admin Anime i Geek] ${mensagem}`
      );

      return;
    }

    const aviso = document.createElement('div');

    aviso.className = `toast ${tipo}`;
    aviso.setAttribute('role', 'status');
    aviso.textContent = mensagem;

    container.appendChild(aviso);

    window.setTimeout(() => {
      aviso.remove();
    }, 4000);
  }

  /* =======================================================
     4. CONTROLE DE TELAS
  ======================================================= */

  function mostrarLogin() {
    mostrar('adminLogin');
    ocultar('adminDashboard');
    ocultar('adminLoading');
    ocultar('adminDenied');
  }

  function mostrarPainel() {
    ocultar('adminLogin');
    mostrar('adminDashboard');
    ocultar('adminLoading');
    ocultar('adminDenied');
  }

  function mostrarCarregamento() {
    mostrar('adminLoading');
    ocultar('adminLogin');
    ocultar('adminDashboard');
    ocultar('adminDenied');
  }

  function mostrarAcessoNegado() {
    ocultar('adminLogin');
    ocultar('adminDashboard');
    ocultar('adminLoading');
    mostrar('adminDenied');
  }

  /* =======================================================
     5. VERIFICAÇÃO DA PERMISSÃO ADMINISTRATIVA
  ======================================================= */

  /*
    O administrador precisa ter uma custom claim chamada
    "admin", definida por um ambiente confiável no servidor.

    Exemplo de verificação:
    token.admin === true

    Não basta criar um campo "admin: true" no perfil
    do usuário no Firestore. Usuários comuns não podem
    conceder privilégios a si mesmos.
  */

  async function verificarPermissao(usuario) {
    if (!usuario) {
      return false;
    }

    try {
      const resultadoToken =
        await usuario.getIdTokenResult();

      return resultadoToken.claims.admin === true;
    } catch (erro) {
      console.error(
        '[Admin] Erro ao verificar permissões:',
        erro
      );

      return false;
    }
  }

  /* =======================================================
     6. ATUALIZAÇÃO DO USUÁRIO NA INTERFACE
  ======================================================= */

  function atualizarInformacoesUsuario(usuario) {
    texto(
      'adminUserEmail',
      usuario?.email || 'Administrador'
    );

    texto(
      'adminUserId',
      usuario?.uid || ''
    );
  }

  /* =======================================================
     7. LOGIN
  ======================================================= */

  async function processarLogin(evento) {
    if (evento) {
      evento.preventDefault();
    }

    if (!firebaseDisponivel) {
      notificar(
        'O Firebase ainda não está configurado.',
        'error'
      );

      return;
    }

    const campoEmail =
      elemento('adminEmail') ||
      elemento('loginEmail');

    const campoSenha =
      elemento('adminPassword') ||
      elemento('loginPassword');

    const botaoEnviar =
      elemento('adminLoginButton') ||
      elemento('loginButton');

    const email = campoEmail?.value.trim() || '';
    const senha = campoSenha?.value || '';

    if (!email || !senha) {
      notificar(
        'Informe o e-mail e a senha.',
        'warning'
      );

      return;
    }

    if (botaoEnviar) {
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = 'Verificando...';
    }

    try {
      const usuario = await entrarComEmail(
        email,
        senha
      );

      const autorizado =
        await verificarPermissao(usuario);

      if (!autorizado) {
        await sairDaConta();

        state.usuario = null;
        state.autorizado = false;

        mostrarAcessoNegado();

        notificar(
          'Esta conta não possui permissão administrativa.',
          'error'
        );

        return;
      }

      state.usuario = usuario;
      state.autorizado = true;

      atualizarInformacoesUsuario(usuario);
      mostrarPainel();

      notificar(
        'Acesso administrativo autorizado.',
        'success'
      );

      await carregarPainel();
    } catch (erro) {
      console.error(
        '[Admin] Falha no login:',
        erro
      );

      notificar(
        traduzirErroLogin(erro),
        'error'
      );
    } finally {
      if (botaoEnviar) {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = 'Entrar';
      }
    }
  }

  function traduzirErroLogin(erro) {
    const codigo = erro?.code || '';

    const mensagens = {
      'auth/invalid-email':
        'O formato do e-mail é inválido.',

      'auth/user-not-found':
        'Conta não encontrada.',

      'auth/wrong-password':
        'E-mail ou senha incorretos.',

      'auth/invalid-credential':
        'E-mail ou senha incorretos.',

      'auth/too-many-requests':
        'Muitas tentativas. Aguarde antes de tentar novamente.',

      'auth/network-request-failed':
        'Falha de conexão. Verifique sua internet.'
    };

    return mensagens[codigo] ||
      'Não foi possível entrar. Verifique os dados e a configuração.';
  }

  /* =======================================================
     8. LOGOUT
  ======================================================= */

  async function processarLogout() {
    try {
      if (firebaseDisponivel) {
        await sairDaConta();
      }

      state.usuario = null;
      state.autorizado = false;
      state.edicao = null;
      state.resultado = null;

      mostrarLogin();

      notificar(
        'Sessão encerrada.',
        'success'
      );
    } catch (erro) {
      console.error(
        '[Admin] Falha ao encerrar sessão:',
        erro
      );

      notificar(
        'Não foi possível encerrar a sessão.',
        'error'
      );
    }
  }

  /* =======================================================
     9. CARREGAMENTO DA EDIÇÃO
  ======================================================= */

  async function carregarEdicao() {
    /*
      O identificador deve corresponder a um documento
      existente em edicoes/{id} no Firestore.

      Informe-o no HTML por meio de:
      data-edition-id="ID_DA_EDICAO"
    */

    const configuracao =
      elemento('adminConfig');

    const edicaoId =
      configuracao?.dataset.editionId ||
      document.body.dataset.editionId ||
      '';

    if (!edicaoId) {
      texto(
        'adminEditionStatus',
        'ID da edição não configurado.'
      );

      texto(
        'adminEditionTitle',
        'Nenhuma edição selecionada'
      );

      return null;
    }

    try {
      const edicao = await obterEdicao(edicaoId);

      if (!edicao) {
        texto(
          'adminEditionStatus',
          'Edição não encontrada.'
        );

        return null;
      }

      state.edicao = edicao;

      texto(
        'adminEditionTitle',
        edicao.titulo || 'Desafio Anime i Geek'
      );

      texto(
        'adminEditionStatus',
        edicao.status || 'Status não informado'
      );

      texto(
        'adminEditionDeadline',
        formatarData(edicao.dataFechamento)
      );

      texto(
        'adminEditionNumbers',
        String(edicao.totalNumeros ?? '—')
      );

      return edicao;
    } catch (erro) {
      console.error(
        '[Admin] Falha ao carregar edição:',
        erro
      );

      texto(
        'adminEditionStatus',
        'Não foi possível carregar a edição.'
      );

      return null;
    }
  }

  /* =======================================================
     10. CARREGAMENTO DO RESULTADO
  ======================================================= */

  async function carregarResultado() {
    const configuracao =
      elemento('adminConfig');

    const resultadoId =
      configuracao?.dataset.resultId ||
      document.body.dataset.resultId ||
      '';

    if (!resultadoId) {
      texto(
        'adminResultStatus',
        'ID do resultado não configurado.'
      );

      return null;
    }

    try {
      const resultado =
        await obterResultado(resultadoId);

      if (!resultado) {
        texto(
          'adminResultStatus',
          'Resultado ainda não encontrado.'
        );

        return null;
      }

      state.resultado = resultado;

      texto(
        'adminResultStatus',
        resultado.status || 'Resultado registrado'
      );

      texto(
        'adminResultDate',
        formatarData(resultado.dataSorteio)
      );

      const numeros = Array.isArray(resultado.numeros)
        ? resultado.numeros
        : [];

      texto(
        'adminWinningNumbers',
        numeros.length
          ? numeros.join(', ')
          : 'Não informado'
      );

      return resultado;
    } catch (erro) {
      console.error(
        '[Admin] Falha ao carregar resultado:',
        erro
      );

      texto(
        'adminResultStatus',
        'Falha ao consultar o resultado.'
      );

      return null;
    }
  }

  /* =======================================================
     11. CARREGAMENTO GERAL
  ======================================================= */

  async function carregarPainel() {
    if (!state.usuario || !state.autorizado) {
      return;
    }

    if (state.carregando) {
      return;
    }

    state.carregando = true;

    try {
      atualizarInformacoesUsuario(state.usuario);

      await Promise.all([
        carregarEdicao(),
        carregarResultado()
      ]);
    } finally {
      state.carregando = false;
    }
  }

  /* =======================================================
     12. FORMULÁRIOS E BOTÕES
  ======================================================= */

  function configurarEventos() {
    const formulario =
      elemento('adminLoginForm') ||
      elemento('loginForm');

    if (formulario) {
      formulario.addEventListener(
        'submit',
        processarLogin
      );
    }

    const botaoLogin =
      elemento('adminLoginButton') ||
      elemento('loginButton');

    if (botaoLogin && !formulario) {
      botaoLogin.addEventListener(
        'click',
        processarLogin
      );
    }

    const botaoLogout =
      elemento('adminLogout') ||
      elemento('logoutButton');

    if (botaoLogout) {
      botaoLogout.addEventListener(
        'click',
        processarLogout
      );
    }

    const botaoAtualizar =
      elemento('adminRefresh') ||
      elemento('refreshDashboard');

    if (botaoAtualizar) {
      botaoAtualizar.addEventListener(
        'click',
        async () => {
          await carregarPainel();

          notificar(
            'Consulta do painel concluída.',
            'info'
          );
        }
      );
    }
  }

  /* =======================================================
     13. OBSERVAÇÃO DA SESSÃO
  ======================================================= */

  function iniciarObservadorAutenticacao() {
    if (!firebaseDisponivel) {
      mostrarLogin();

      notificar(
        'Configure o Firebase antes de utilizar o painel.',
        'warning'
      );

      return;
    }

    state.cancelarObservador = observarUsuario(
      async usuario => {
        if (!usuario) {
          state.usuario = null;
          state.autorizado = false;

          mostrarLogin();

          return;
        }

        mostrarCarregamento();

        const autorizado =
          await verificarPermissao(usuario);

        if (!autorizado) {
          state.usuario = null;
          state.autorizado = false;

          mostrarAcessoNegado();

          return;
        }

        state.usuario = usuario;
        state.autorizado = true;

        atualizarInformacoesUsuario(usuario);
        mostrarPainel();

        await carregarPainel();
      }
    );
  }

  /* =======================================================
     14. INICIALIZAÇÃO
  ======================================================= */

  function iniciar() {
    configurarEventos();

    const configuracao = verificarConfiguracao();

    if (!configuracao.disponivel) {
      mostrarLogin();

      texto(
        'adminSystemStatus',
        'Firebase não configurado'
      );

      console.warn(
        '[Admin] Configure js/firebase.js antes de utilizar o painel.'
      );

      return;
    }

    texto(
      'adminSystemStatus',
      'Conexão Firebase inicializada'
    );

    iniciarObservadorAutenticacao();
  }

  /* =======================================================
     15. INTERFACE PÚBLICA DO MÓDULO
  ======================================================= */

  return {
    iniciar,
    processarLogin,
    processarLogout,
    carregarPainel,
    verificarPermissao
  };
})();

/* =========================================================
   EXECUÇÃO
========================================================= */

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    AdminDesafio.iniciar,
    { once: true }
  );
} else {
  AdminDesafio.iniciar();
}
