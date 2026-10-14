/* =========================================================
   DESAFIO ANIME I GEEK
   Arquivo: js/firebase.js

   Responsabilidades:
   - Inicializar Firebase
   - Configurar Firestore
   - Configurar autenticação
   - Disponibilizar referências aos serviços
   - Preparar funções de leitura e autenticação

   IMPORTANTE:
   Configure os dados reais do projeto Firebase.
   Operações críticas devem ser executadas no servidor.
========================================================= */

import { initializeApp } from
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

/* =========================================================
   1. CONFIGURAÇÃO DO FIREBASE
========================================================= */

/*
  Acesse o Console do Firebase:
  https://console.firebase.google.com/

  Abra o projeto correto e vá até:
  Configurações do projeto > Geral > Seus aplicativos.

  Copie a configuração do aplicativo Web e substitua
  os valores abaixo pelos dados reais do seu projeto.

  A configuração web não é uma senha de administrador.
  Mesmo assim, as regras do Firestore e a autenticação
  precisam estar configuradas corretamente.
*/

const firebaseConfig = {
  apiKey: 'COLOQUE_SUA_API_KEY',
  authDomain: 'COLOQUE_SEU_PROJETO.firebaseapp.com',
  projectId: 'COLOQUE_SEU_PROJECT_ID',
  storageBucket: 'COLOQUE_SEU_PROJETO.firebasestorage.app',
  messagingSenderId: 'COLOQUE_SEU_MESSAGING_SENDER_ID',
  appId: 'COLOQUE_SEU_APP_ID'
};

/* =========================================================
   2. INICIALIZAÇÃO
========================================================= */

let app = null;
let db = null;
let auth = null;
let firebaseDisponivel = false;

try {
  const configuracaoValida =
    firebaseConfig.apiKey !== 'COLOQUE_SUA_API_KEY' &&
    firebaseConfig.projectId !== 'COLOQUE_SEU_PROJECT_ID' &&
    firebaseConfig.appId !== 'COLOQUE_SEU_APP_ID';

  if (configuracaoValida) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    firebaseDisponivel = true;

    console.info(
      '[Firebase] Serviços inicializados.'
    );
  } else {
    console.warn(
      '[Firebase] Configure os dados reais em js/firebase.js.'
    );
  }
} catch (erro) {
  console.error(
    '[Firebase] Falha ao inicializar:',
    erro
  );
}

/* =========================================================
   3. VERIFICAÇÃO DA CONEXÃO
========================================================= */

function verificarConfiguracao() {
  return {
    disponivel: firebaseDisponivel,
    firestore: Boolean(db),
    autenticacao: Boolean(auth),
    projeto: firebaseConfig.projectId
  };
}

function exigirFirebase() {
  if (!firebaseDisponivel || !db || !auth) {
    throw new Error(
      'Firebase não configurado. Verifique js/firebase.js.'
    );
  }
}

/* =========================================================
   4. AUTENTICAÇÃO
========================================================= */

function observarUsuario(callback) {
  if (!firebaseDisponivel || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, usuario => {
    callback(usuario);
  });
}

async function entrarComEmail(email, senha) {
  exigirFirebase();

  if (!email || !senha) {
    throw new Error(
      'Informe o e-mail e a senha.'
    );
  }

  const credencial = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    senha
  );

  return credencial.user;
}

async function criarContaComEmail(email, senha) {
  exigirFirebase();

  if (!email || !senha) {
    throw new Error(
      'Informe o e-mail e a senha.'
    );
  }

  if (senha.length < 6) {
    throw new Error(
      'A senha precisa ter pelo menos 6 caracteres.'
    );
  }

  const credencial = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    senha
  );

  return credencial.user;
}

async function sairDaConta() {
  exigirFirebase();

  await signOut(auth);
}

function obterUsuarioAtual() {
  if (!firebaseDisponivel || !auth) {
    return null;
  }

  return auth.currentUser;
}

/* =========================================================
   5. LEITURA DE DOCUMENTOS
========================================================= */

async function lerDocumento(nomeColecao, idDocumento) {
  exigirFirebase();

  if (!nomeColecao || !idDocumento) {
    throw new Error(
      'Informe a coleção e o identificador do documento.'
    );
  }

  const referencia = doc(
    db,
    nomeColecao,
    idDocumento
  );

  const resultado = await getDoc(referencia);

  if (!resultado.exists()) {
    return null;
  }

  return {
    id: resultado.id,
    ...resultado.data()
  };
}

/* =========================================================
   6. LEITURA DE COLEÇÕES
========================================================= */

async function lerColecao(nomeColecao, quantidade = 20) {
  exigirFirebase();

  if (!nomeColecao) {
    throw new Error(
      'Informe o nome da coleção.'
    );
  }

  const quantidadeSegura = Math.min(
    Math.max(Number(quantidade) || 20, 1),
    100
  );

  const referencia = collection(
    db,
    nomeColecao
  );

  const consulta = query(
    referencia,
    limit(quantidadeSegura)
  );

  const resultado = await getDocs(consulta);

  return resultado.docs.map(documento => ({
    id: documento.id,
    ...documento.data()
  }));
}

/* =========================================================
   7. LEITURA DA EDIÇÃO ATIVA
========================================================= */

/*
  Estrutura sugerida no Firestore:

  edicoes/{idDaEdicao}

  {
    titulo: "Desafio Anime i Geek",
    status: "aberta",
    dataAbertura: ...,
    dataFechamento: ...,
    totalNumeros: 1000
  }

  A estrutura ainda precisa ser criada no Firebase.
*/

async function obterEdicao(edicaoId) {
  exigirFirebase();

  if (!edicaoId) {
    throw new Error(
      'Informe o identificador da edição.'
    );
  }

  return lerDocumento(
    'edicoes',
    edicaoId
  );
}

/* =========================================================
   8. LEITURA DOS RESULTADOS
========================================================= */

/*
  Estrutura sugerida:

  resultados/{idDoResultado}

  Os resultados oficiais devem ser gravados por uma
  função confiável no servidor, nunca por usuários comuns.
*/

async function obterResultado(resultadoId) {
  exigirFirebase();

  if (!resultadoId) {
    throw new Error(
      'Informe o identificador do resultado.'
    );
  }

  return lerDocumento(
    'resultados',
    resultadoId
  );
}

/* =========================================================
   9. EXPORTAÇÕES
========================================================= */

export {
  app,
  db,
  auth,
  firebaseDisponivel,

  verificarConfiguracao,
  observarUsuario,
  entrarComEmail,
  criarContaComEmail,
  sairDaConta,
  obterUsuarioAtual,

  lerDocumento,
  lerColecao,
  obterEdicao,
  obterResultado
};
