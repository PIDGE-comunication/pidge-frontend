# Plano de Páginas — Especificação Precisa (o que fazer e o que alterar)

> Documento único de planejamento. Cruza `mapa_paginas_usuario (2).html`, `Sistema_fluxo.md` e o código atual em `src/app/**`.
> Contém: (1) inventário de status, (2) decisões de produto fixadas, (3) **Parte A — páginas a criar** com especificação precisa, (4) **Parte B — alterações em páginas existentes**, (5) ordem de execução e (6) checklist.

---

## 1. Inventário (mapa × fluxo × código)

Legenda: ✅ Implementado · 🗑️ Removido

> **Status: tudo de doc.md implementado** e validado com `next build` (15 rotas compilando). Ver Parte C para o controle de acesso por papel (super_admin).

| Área | Página | Rota | Arquivo | Status |
|---|---|---|---|---|
| Aluno | Feed | `/feed` | `src/app/(aluno)/feed/page.tsx` | ✅ |
| Aluno | **Detalhe do comunicado** | `/comunicados/:id` | `src/app/comunicados/[id]/page.tsx` + `ComunicadoDetalheClient.tsx` | ✅ (A1) |
| Aluno | Agenda | `/agenda` | `src/app/agenda/page.tsx` | ✅ |
| Grêmio | Meus comunicados | `/meus-comunicados` | `src/app/meus-comunicados/page.tsx` | ✅ |
| Grêmio | Editor | `/comunicados/novo` · `/comunicados/:id/editar` | `comunicados/novo`, `comunicados/[id]/editar` + `_components/ComunicadoEditor.tsx` | ✅ |
| Grêmio | Painel de presenças | `/comunicados/:id/presencas` | `comunicados/[id]/presencas/page.tsx` | ✅ |
| Admin | Painel de aprovação | `/admin/aprovacoes` | `src/app/admin/aprovacoes/page.tsx` | ✅ (só super_admin) |
| Admin | **Todos os comunicados** | `/admin/comunicados` | `src/app/admin/comunicados/page.tsx` | ✅ (A2) |
| Admin | **Página de conflitos** | `/admin/conflitos` | `src/app/admin/conflitos/page.tsx` | ✅ (A3) |
| Admin | Gestão de usuários | `/admin/usuarios` | `src/app/admin/usuarios/page.tsx` | ✅ (B3, só super_admin) |
| Admin | **Configurações** | `/admin/configuracoes` | `src/app/admin/configuracoes/page.tsx` | ✅ (A4, só super_admin) |
| Comum | Login | `/login` | `src/app/(auth)/login/page.tsx` | ✅ (B2) |
| Comum | Perfil | `/perfil` | `src/app/perfil/page.tsx` | ✅ |
| Comum | **Erro 404** | `not-found.tsx` | `src/app/not-found.tsx` | ✅ (A5) |
| Comum | Cadastro de aluno | `/cadastro` | — | 🗑️ removido (B1) |

**Total:** 13 páginas implementadas · 1 removida. Build verde.

---

## 2. Decisões de produto fixadas

> Estas decisões fecham as divergências entre o mapa, o fluxo e o código. Valem como fonte de verdade para a implementação.

- **DEC‑1 — Cadastro centralizado no admin.** Não há auto‑cadastro. **O admin cadastra alunos e membros do grêmio** (e outros admins) pela tela `/admin/usuarios` (`POST /admin/usuarios`). A rota `/auth/register` **não existe** e não deve ser usada. → A página `/cadastro` e o link "Criar conta" no login serão **removidos** (ver B1).
- **DEC‑2 — Perfil escolar por `curso_id` / `sala_id` / `turno`.** Os campos de perfil escolar são **referências (FK)**, não texto livre:
  - `curso_id` → tabela `cursos` (id, nome, turno)
  - `sala_id` → tabela `salas` (id, nome, turno)
  - `turno` → enum `manha | tarde | noite`
  - O front deve carregar cursos e salas de endpoints de referência e usar `<select>` por **id**, nunca por nome. (ver B3).
- **DEC‑3 — Grêmio também tem perfil escolar.** Membros do grêmio são estudantes; o formulário de usuário deve permitir `curso_id`/`sala_id`/`turno` para papéis `aluno` **e** `gremio` (ver B3).
- **DEC‑4 — Papel `super_admin` (acima de `admin`).** Foi adicionado um quarto papel. **Apenas o `super_admin`** pode: cadastrar/editar/excluir usuários, acessar configurações e aprovar publicações do grêmio. A página de conflitos é acessível ao `super_admin` (todos) e aos **autores** dos comunicados envolvidos. O `admin` continua podendo publicar comunicados direto e ver "Todos os comunicados". Detalhes e matriz completa na **Parte C**.

---

## PARTE A — Páginas a criar

### A1. 🔴 Detalhe do comunicado — `/comunicados/[id]/page.tsx`  (P0, crítico)

**Por que é crítico:** o Feed (`(aluno)/feed/page.tsx:206`) e a Agenda (`agenda/page.tsx:372`) já apontam para `/comunicados/${id}`. Como a página não existe, **qualquer clique em um card hoje resulta em 404.**

**Arquivo a criar:** `src/app/comunicados/[id]/page.tsx` (irmão de `editar/` e `presencas/`, que já existem).

**Objetivo:** exibir o comunicado completo e permitir ao aluno confirmar/desmarcar presença.

**Componentes (do mapa):**
- *Conteúdo principal:* título grande; imagem em destaque (se houver); texto completo renderizado (markdown/HTML simples); autor (nome + papel) + data de publicação; período de vigência (início → fim); público‑alvo detalhado; badge de prioridade.
- *Ação de presença:*
  - Botão **Confirmar presença** (opt‑in, para comunicados não obrigatórios).
  - Status atual: `confirmado` / `desmarcado` / automático.
  - Se `obrigatorio = true`: aviso "Presença automática registrada".
  - Botão **Desmarcar** → abre modal com campo de justificativa.
  - Validação: justificativa com no mínimo `MIN_JUSTIFICATIVA_CHARS` caracteres (padrão 20; valor vem de `/admin/configuracoes`).
  - Contador de confirmações visível ao aluno.
- *Bloco de agenda:* indicador "na sua agenda" (se confirmado) + link "Ver na agenda" (`/agenda`).

**API consumida (de `Sistema_fluxo.md`):**
- `GET /comunicados/:id` — detalhe.
- `POST /comunicados/:id/presenca` — confirma presença.
- `DELETE /comunicados/:id/presenca` — desmarca; body `{ justificativa: string }` (≥ 20 chars).

**Estados a tratar:** loading; 404 (comunicado inexistente → usar `not-found`); 403 (aluno fora do público‑alvo); erro de rede; sucesso/erro das ações de presença (toast).

**Regras:** comunicado obrigatório já vem `confirmado` automaticamente; desmarcar (mesmo obrigatório) exige justificativa válida.

---

### A2. 🟠 Todos os comunicados (admin) — `/admin/comunicados/page.tsx`  (P1)

**Arquivo a criar:** `src/app/admin/comunicados/page.tsx` (diretório já existe, vazio).

**Objetivo:** visão completa de todos os comunicados do sistema, independente de autor ou status.

**Componentes:**
- *Tabela completa:* colunas título, autor, prioridade, público, período, status, presenças; ordenação por qualquer coluna; paginação (ou scroll infinito); ações por linha: ver detalhe, editar, arquivar, ver presenças (`/comunicados/:id/presencas`).
- *Filtros avançados:* status (seleção múltipla), autor / papel do autor, prioridade, público‑alvo, período de vigência, busca por título.
- Proteção de papel: somente `admin` (seguir o padrão de `admin/usuarios`, que bloqueia não‑admin com tela "Acesso restrito").

**API consumida:** `GET /admin/comunicados` com query params `status`, `prioridade`, `data_inicio`, `data_fim`, `publico`, `page`, `limit`. Arquivar via `DELETE /comunicados/:id` (status → `arquivado`).

**Estados:** loading; lista vazia; erro.

---

### A3. 🟠 Página de conflitos (admin) — `/admin/conflitos/page.tsx`  (P1)

**Arquivo a criar:** `src/app/admin/conflitos/page.tsx`.

**Objetivo:** listar sobreposições detectadas automaticamente; cada conflito exige resolução.

**Componentes:**
- *Card de conflito:* os dois comunicados lado a lado; sobreposição destacada (período e público em conflito); quem criou cada um e quando; status de resolução.
- *Ações de resolução:* descartar comunicado A ou B; editar data de um dos dois (redireciona para o editor `/comunicados/:id/editar`); editar público de um dos dois; marcar como resolvido manualmente.
- *Histórico:* conflitos resolvidos arquivados, tipo de resolução aplicada, quem resolveu e quando.

**API consumida:** `GET /conflitos` (não resolvidos), `GET /conflitos/:id` (detalhe com os dois comunicados), `PATCH /conflitos/:id/resolver` com `resolucao ∈ { descartado_a, descartado_b, data_alterada, publico_alterado }`.

**Estados:** loading; "nenhum conflito pendente" (estado vazio positivo); erro.

---

### A4. 🟠 Configurações do sistema (admin) — `/admin/configuracoes/page.tsx`  (P1)

**Arquivo a criar:** `src/app/admin/configuracoes/page.tsx`.

**Objetivo:** parâmetros globais que afetam o comportamento do sistema (hoje só existem como variáveis de ambiente).

**Componentes:**
- *Toggles:* habilitar/desabilitar publicações do grêmio (`GREMIO_HABILITADO`); exigir aprovação para o grêmio (sempre ativo quando o grêmio está habilitado).
- *Parâmetros:* mínimo de caracteres para justificativa de desmarcação (`MIN_JUSTIFICATIVA_CHARS`); e‑mail remetente das notificações (`EMAIL_FROM`); prazo máximo para resolver conflitos (dias).

**API consumida:** `GET /admin/configuracoes`, `PATCH /admin/configuracoes`.

**Dependências que esta tela alimenta:** o aviso "permissão do grêmio desativada" em Meus comunicados e o mínimo de caracteres da justificativa no Detalhe (A1) passam a ter fonte de verdade configurável.

---

### A5. 🟡 Páginas de erro 403 / 404  (P2)

**Arquivos a criar:** `src/app/not-found.tsx` (404) e tratamento de não autorizado 403. No App Router desta versão, consultar `node_modules/next/dist/docs/` para decidir entre `not-found.tsx`, `forbidden.tsx`/`unauthorized.tsx` e `error.tsx` (conforme `AGENTS.md`, a API pode diferir do padrão conhecido).

**Conteúdo:** código do erro (403/404), mensagem amigável, botão "Voltar ao início" para a home do papel (aluno → `/feed`, grêmio → `/meus-comunicados`, admin → `/admin/comunicados`).

---

## PARTE B — Alterações em páginas existentes

### B1. 🔧 Remover auto‑cadastro  (decorre de DEC‑1)

**O que alterar:**
1. **Excluir** o diretório `src/app/(auth)/cadastro/` inteiro (`page.tsx` + `cadastro.module.css`).
2. Em `src/app/(auth)/login/page.tsx`:
   - **Remover** o bloco "Não possui uma conta? / Criar conta" com `<Link href="/cadastro">` (linhas ~171‑174).
   - **Remover** a lógica de sucesso de cadastro: `useSearchParams` lendo `?cadastro=sucesso` e o estado `sucesso` (linhas ~9, 14, 17‑21, 92‑97) — a menos que seja reaproveitada para outra mensagem.
3. Garantir que nenhuma outra tela referencia `/cadastro` ou `/auth/register`.

**Motivo:** a criação de usuários é exclusiva do admin (`POST /admin/usuarios`). `/auth/register` não existe na API.

---

### B2. 🔧 Corrigir redirecionamento pós‑login (bug)  — `src/app/(auth)/login/page.tsx`

**Problema atual (linhas ~46‑52):** após login, o destino é calculado como:
```
aluno → /aluno
professor → /professor   ← "professor" não é um papel deste sistema
admin → /admin
fallback → /dashboard
```
Nenhuma dessas rotas existe (`/aluno`, `/professor`, `/dashboard`, `/admin` sem subrota), e `professor` não está no enum de papéis (`admin | gremio | aluno`).

**Alteração precisa — mapear para as rotas reais por papel:**
| Papel | Destino correto |
|---|---|
| `aluno` | `/feed` |
| `gremio` | `/meus-comunicados` |
| `admin` | `/admin/comunicados` (ou `/admin/aprovacoes`) |

Remover a entrada `professor` e o fallback `/dashboard` (usar `/feed` como fallback seguro ou `/login`).

---

### B3. 🔧 Gestão de usuários: migrar para `curso_id`/`sala_id` e ligar à API  — `src/app/admin/usuarios/page.tsx`  (decorre de DEC‑2 e DEC‑3)

**Estado atual:** funciona com `MOCK_USERS` em estado local; `curso` é o **nome** do curso (array `CURSOS` hardcoded, linhas 22‑29); `sala` é **texto livre** em maiúsculas (input, linhas 712‑722); perfil escolar só aparece para `papel === 'aluno'` (linha 680).

**Alterações precisas:**
1. **Modelo de dados (interface `Usuario` e `FormState`):**
   - Trocar `curso?: string` → `curso_id?: string` (FK).
   - Trocar `sala?: string` → `sala_id?: string` (FK).
   - Manter `turno?: 'manha' | 'tarde' | 'noite'`.
2. **Fontes de referência (substituir hardcode):**
   - Remover o array `CURSOS` fixo. Carregar **cursos** e **salas** de endpoints de referência (tabelas `cursos` e `salas`: `id, nome, turno`).
   - Campo Curso: `<select>` por `curso_id` (exibe `nome`, envia `id`).
   - Campo Sala: `<select>` por `sala_id` (exibe `nome`, envia `id`) — **não** input de texto livre. Como `salas` têm `turno`, o `turno` pode ser **derivado** da sala selecionada (ou mantido como select e validado contra a sala). Definir na implementação; preferir derivar de `sala_id`.
3. **Perfil escolar para grêmio (DEC‑3):** trocar a condição `form.papel === 'aluno'` por `form.papel === 'aluno' || form.papel === 'gremio'` nos blocos de exibição (linha ~680), validação (linhas ~251‑255) e montagem do payload (linhas ~268‑274). Apenas `admin` fica sem perfil escolar.
4. **Ligar à API real (remover mock):**
   - `GET /admin/usuarios` para popular a lista.
   - `POST /admin/usuarios` ao criar.
   - `PATCH /admin/usuarios/:id` ao editar (incl. papel).
   - `DELETE /admin/usuarios/:id` para desativar.
   - Reset de senha: confirmar endpoint real (não há rota documentada em `Sistema_fluxo.md` → **lacuna**, ver §4).
5. **Exibição na tabela:** a coluna "Curso · sala · turno" deve resolver `curso_id`/`sala_id` para os nomes carregados das referências (linhas ~510‑521).

---

## PARTE C — Papéis e controle de acesso (super_admin)

> Implementa a DEC‑4. Quatro papéis: `super_admin` · `admin` · `gremio` · `aluno`.

### C.1 Matriz de acesso

| Recurso / Rota | super_admin | admin | gremio | aluno |
|---|:---:|:---:|:---:|:---:|
| Cadastrar / editar / excluir usuários — `/admin/usuarios` | ✅ | ❌ | ❌ | ❌ |
| Configurações do sistema — `/admin/configuracoes` | ✅ | ❌ | ❌ | ❌ |
| Aprovar/rejeitar publicações do grêmio — `/admin/aprovacoes` | ✅ | ❌ | ❌ | ❌ |
| Página de conflitos — `/admin/conflitos` | ✅ (todos) | só se for **autor** de um dos comunicados | só se for **autor** | ❌ |
| Todos os comunicados — `/admin/comunicados` | ✅ | ✅ | ❌ | ❌ |
| Criar/publicar comunicado (editor) | ✅ publica direto + pode marcar **obrigatório** | ✅ publica direto + pode marcar **obrigatório** | envia para aprovação | ❌ |
| Feed / Detalhe / Agenda | — | — | — | ✅ |

> Regra de negócio mantida: `obrigatorio` só pode ser definido por papéis de nível admin (`admin`/`super_admin`); o grêmio nunca define.

### C.2 Página de conflitos — regra de visibilidade

- `super_admin` vê **todos** os conflitos.
- Demais papéis veem **apenas** os conflitos em que são **autores** de um dos dois comunicados envolvidos (comparação por `autor_id`). Quem não é super_admin nem autor recebe "Acesso restrito".
- Quem tem acesso pode resolver: descartar A/B, editar data/público (vai ao editor) ou marcar como resolvido.

### C.3 Arquivos alterados para o super_admin

| Arquivo | Mudança |
|---|---|
| `src/hooks/useUser.ts` | `User.papel` passa a incluir `super_admin`. |
| `src/app/perfil/page.tsx` | `PerfilData.papel` + label "Super administrador". |
| `src/app/admin/usuarios/page.tsx` | acesso restrito a `super_admin`; `super_admin` vira opção de papel no formulário e no filtro; descrições por papel atualizadas. |
| `src/app/admin/configuracoes/page.tsx` | acesso restrito a `super_admin`. |
| `src/app/admin/aprovacoes/page.tsx` | acesso restrito a `super_admin`. |
| `src/app/admin/conflitos/page.tsx` | `autor_id` nos comunicados; super_admin vê tudo, autores veem os seus; "Voltar" para a home do papel. |
| `src/app/admin/comunicados/page.tsx` | acesso a `admin` **e** `super_admin`; link "← Aprovações" só para `super_admin`. |
| `src/app/comunicados/_components/ComunicadoEditor.tsx` | `ehAdminLevel` (= `admin` ou `super_admin`): publica direto, marca obrigatório, roda checagem de conflito. |
| `src/app/(auth)/login/page.tsx` · `src/app/not-found.tsx` | `super_admin` → home `/admin/comunicados`. |
| `src/app/meus-comunicados/page.tsx` | atalhos "Usuários" e "Fila de aprovações" passam a aparecer **só para `super_admin`** (removidos da UX do `admin`, pois apontam para páginas exclusivas do super_admin). |

> **UX:** os links para `/admin/aprovacoes` (em `meus-comunicados` e no cabeçalho de `/admin/comunicados`) deixam de ser exibidos para o `admin` comum — só o `super_admin` os vê, evitando becos sem saída.

### C.4 Como testar os papéis

No `.env.local`, ajuste `NEXT_PUBLIC_DEV_PAPEL` (`super_admin | admin | gremio | aluno`) e reinicie o `npm run dev`.

---

## 3. Ordem de execução recomendada

1. **A1 · `/comunicados/[id]`** — desbloqueia navegação do aluno (P0, corrige 404 do feed e da agenda).
2. **B2 · corrigir redirect do login** — rápido; sem isso, o login leva a rotas inexistentes.
3. **B1 · remover cadastro** — alinha ao DEC‑1; pequeno e isolado.
4. **A2 · `/admin/comunicados`** — núcleo da visão do admin (diretório já existe).
5. **A4 · `/admin/configuracoes`** — fornece flags que A1 e Meus comunicados consomem.
6. **A3 · `/admin/conflitos`** — fecha o fluxo de publicação (detecção de conflito).
7. **B3 · `curso_id`/`sala_id` + API em `/admin/usuarios`** — depende dos endpoints de referência (cursos/salas) e do backend.
8. **A5 · páginas de erro 403/404** — resiliência/UX.

---

## 4. Lacunas para confirmar com o backend

- **Endpoints de referência** de `cursos` e `salas` (para os selects de B3) não estão listados em `Sistema_fluxo.md`. Confirmar rotas (ex.: `GET /cursos`, `GET /salas`).
- **Reset de senha** do admin (botão já existe em `/admin/usuarios`) não tem rota documentada. Confirmar (ex.: `POST /admin/usuarios/:id/reset-senha`).
- **Configurações** (`/admin/configuracoes`) precisa do contrato de payload (`GET`/`PATCH`) — confirmar nomes dos campos retornados.

---

## 5. Checklist

**Criar** — todas concluídas
- [x] A1 · `/comunicados/[id]` — Detalhe do comunicado (P0)
- [x] A2 · `/admin/comunicados` — Todos os comunicados
- [x] A3 · `/admin/conflitos` — Página de conflitos
- [x] A4 · `/admin/configuracoes` — Configurações
- [x] A5 · `not-found.tsx` — Página 404 (403 tratado inline por página com "Acesso restrito")

**Alterar** — todas concluídas
- [x] B1 · Remover `/cadastro` + link no login
- [x] B2 · Corrigir destinos de redirect pós‑login (`/feed`, `/meus-comunicados`, `/admin/comunicados`)
- [x] B3 · `/admin/usuarios`: `curso_id`/`sala_id`/`turno`, selects de referência, perfil escolar p/ grêmio, ligar à API

**Parte C — super_admin** — concluída
- [x] Papel `super_admin` em `useUser`/`perfil`
- [x] `/admin/usuarios`, `/admin/configuracoes`, `/admin/aprovacoes` restritos a `super_admin`
- [x] `/admin/conflitos` para super_admin (todos) + autores (os seus)
- [x] Editor: super_admin publica direto e marca obrigatório
- [x] Link "Aprovações" removido da UX do `admin` (só `super_admin` vê)

**Já existentes (sem mudança de escopo)**
- [x] `/feed` · `/agenda` · `/comunicados/novo` · `/comunicados/[id]/editar` · `/comunicados/[id]/presencas`

---

> **Nota (AGENTS.md):** esta versão do Next.js tem convenções próprias — ler o guia em `node_modules/next/dist/docs/` antes de implementar cada página (rotas dinâmicas, `not-found`/`forbidden`, data fetching).
