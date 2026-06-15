# Sistema de Comunicados Escolares — Contexto do Projeto

## Visão geral

Sistema web para publicação e gestão de comunicados escolares. Administradores publicam comunicados direcionados a públicos específicos (escola inteira, cursos, salas ou turnos). O Grêmio Estudantil também pode publicar, mas depende de aprovação da administração antes de o comunicado se tornar visível. Alunos visualizam os comunicados do seu perfil, confirmam presença e têm uma agenda pessoal. O sistema detecta automaticamente sobreposição de comunicados e notifica os responsáveis.

---

## Papéis de usuário

| Papel | Descrição |
|-------|-----------|
| super_admin | Controle total. **Exclusivo:** cadastra/edita/exclui usuários, configura o sistema e aprova/rejeita publicações do grêmio. Vê e resolve **todos** os conflitos. Também publica comunicados diretamente |
| admin | Publica comunicados diretamente e acompanha todos os comunicados. Vê apenas os conflitos em que é autor. **Não** gerencia usuários, configurações nem aprovações |
| gremio | Cria comunicados que entram em fila de aprovação. Só publica após aprovação. Vê apenas os conflitos em que é autor |
| aluno | Visualiza comunicados do seu perfil, confirma/desmarca presença, acessa agenda pessoal |

> A permissão do grêmio pode ser desativada globalmente pelo **super_admin** nas configurações do sistema.
>
> **Controle de acesso (resumo):** apenas `super_admin` acessa `/admin/usuarios`, `/admin/configuracoes` e `/admin/aprovacoes`. A página `/admin/conflitos` é vista pelo `super_admin` (todos os conflitos) e pelos autores dos comunicados em conflito (apenas os seus). O campo `obrigatorio` só pode ser definido por papéis de nível admin (`admin`/`super_admin`).

---

## Entidades do banco de dados

### usuarios
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| nome | string | |
| email | string unique | |
| senha_hash | string | |
| papel | enum(super_admin, admin, gremio, aluno) | |
| curso_id | uuid FK nullable | Curso ao qual o aluno pertence |
| sala_id | uuid FK nullable | Sala do aluno |
| turno | enum(manha, tarde, noite) nullable | |
| ativo | boolean | |
| criado_em | timestamp | |

### comunicados
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| titulo | string | |
| texto | text | Suporta markdown ou HTML simples |
| imagem_url | string nullable | Imagem opcional do comunicado |
| prioridade | enum(baixa, media, alta, urgente) | |
| obrigatorio | boolean | Se true, vai automaticamente à agenda de todos do público-alvo |
| data_inicio | timestamp | Quando o comunicado começa a ser exibido |
| data_fim | timestamp | Quando o comunicado deixa de ser exibido |
| autor_id | uuid FK | Referência ao usuário que criou |
| tipo_autor | enum(admin, gremio) | |
| status | enum(rascunho, aguardando_aprovacao, publicado, arquivado, rejeitado) | |
| motivo_rejeicao | text nullable | Preenchido pela adm ao rejeitar |
| criado_em | timestamp | |
| publicado_em | timestamp nullable | |

### publico_comunicado
Define a audiência do comunicado. Um comunicado pode ter múltiplos registros (ex: turma A do curso X + turno noturno).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| comunicado_id | uuid FK | |
| tipo | enum(escola_inteira, curso, sala, turno) | |
| referencia_id | uuid nullable | ID do curso ou sala (null quando tipo = escola_inteira ou turno) |
| turno | enum(manha, tarde, noite) nullable | Preenchido quando tipo = turno |

> Regra: escola_inteira intersecta qualquer outro público. Dois comunicados com públicos de tipos diferentes intersectam se tiverem pelo menos um valor em comum.

### presencas
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| comunicado_id | uuid FK | |
| aluno_id | uuid FK | |
| status | enum(confirmado, desmarcado) | |
| justificativa | text nullable | Obrigatória ao desmarcar |
| criado_em | timestamp | |
| atualizado_em | timestamp | |

### conflitos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| comunicado_a_id | uuid FK | |
| comunicado_b_id | uuid FK | |
| resolvido | boolean | |
| resolucao | enum(descartado_a, descartado_b, data_alterada, publico_alterado) nullable | |
| criado_em | timestamp | |

### cursos e salas
Tabelas de referência simples com id, nome, turno.

---

## Rotas da API

### Autenticação — /auth

| Método | Rota | Papel | Descrição |
|--------|------|-------|-----------|
| POST | /auth/login | público | Login com email + senha. Retorna JWT |
| POST | /auth/logout | autenticado | Invalida token |
| GET | /auth/me | autenticado | Retorna dados e papel do usuário logado |

### Comunicados — /comunicados

| Método | Rota | Papel | Descrição |
|--------|------|-------|-----------|
| GET | /comunicados | aluno/gremio/admin | Lista comunicados visíveis ao perfil do usuário logado, ordenados por prioridade e data |
| GET | /comunicados/:id | autenticado | Detalhe de um comunicado |
| POST | /comunicados | admin/gremio | Cria comunicado. Admin publica direto (status=publicado). Grêmio entra como aguardando_aprovacao |
| PATCH | /comunicados/:id | autor/admin | Edita campos do comunicado (vedado se já publicado, salvo para admin) |
| DELETE | /comunicados/:id | autor/admin | Arquiva o comunicado (status=arquivado) |
| PATCH | /comunicados/:id/aprovar | admin | Aprova comunicado do grêmio → muda status para publicado e dispara lógica de agenda/conflito |
| PATCH | /comunicados/:id/rejeitar | admin | Rejeita com campo motivo_rejeicao. Notifica grêmio |
| GET | /comunicados/:id/presencas | autor/admin | Lista presencas, ausentes e justificativas do comunicado |

*Query params de /comunicados:*
- status — filtra por status (uso admin)
- prioridade — filtra por prioridade
- data_inicio / data_fim — intervalo
- publico — filtra por tipo de público
- page / limit — paginação

### Presenças — /comunicados/:id/presenca

| Método | Rota | Papel | Descrição |
|--------|------|-------|-----------|
| POST | /comunicados/:id/presenca | aluno | Confirma presença no evento |
| DELETE | /comunicados/:id/presenca | aluno | Desmarca presença. Body obrigatório: { justificativa: string } com mínimo de 20 caracteres |

### Agenda — /agenda

| Método | Rota | Papel | Descrição |
|--------|------|-------|-----------|
| GET | /agenda | aluno | Lista comunicados na agenda pessoal do aluno (confirmados + obrigatórios) |
| GET | /agenda?mes=2025-09 | aluno | Filtra por mês no formato YYYY-MM |

### Conflitos — /conflitos

| Método | Rota | Papel | Descrição |
|--------|------|-------|-----------|
| GET | /conflitos | admin | Lista todos os conflitos não resolvidos |
| GET | /conflitos/:id | admin | Detalhe de um conflito com os dois comunicados envolvidos |
| PATCH | /conflitos/:id/resolver | admin | Marca como resolvido com campo resolucao |

### Administração — /admin

| Método | Rota | Papel | Descrição |
|--------|------|-------|-----------|
| GET | /admin/comunicados | admin | Todos os comunicados com filtros completos de status |
| GET | /admin/usuarios | admin | Lista todos os usuários |
| POST | /admin/usuarios | admin | Cria usuário |
| PATCH | /admin/usuarios/:id | admin | Edita usuário (inclusive papel) |
| DELETE | /admin/usuarios/:id | admin | Desativa usuário |
| GET | /admin/configuracoes | admin | Configurações do sistema |
| PATCH | /admin/configuracoes | admin | Atualiza configurações (ex: habilitar/desabilitar grêmio) |

---

## Regras de negócio

### Publicação e aprovação
- Comunicados do grêmio entram sempre como aguardando_aprovacao. Ficam invisíveis para alunos até aprovação.
- A adm pode habilitar ou desabilitar globalmente a capacidade do grêmio de criar comunicados via configuração do sistema.
- Ao aprovar, o sistema dispara imediatamente a lógica de detecção de conflito e a lógica de agenda para eventos obrigatórios.

### Detecção de conflito
Executada ao publicar (admin) ou ao aprovar (fluxo do grêmio).

1. Busca todos os comunicados com status=publicado cujo intervalo (data_inicio, data_fim) se sobrepõe ao do novo comunicado.
2. Para cada candidato, verifica interseção de público-alvo:
   - Se qualquer dos dois for escola_inteira, há interseção garantida.
   - Caso contrário, verifica se há ao menos um (tipo, referencia_id) em comum entre os registros de publico_comunicado dos dois.
3. Se houver interseção de período E de público, registra um conflito no banco.
4. Dispara e-mail transacional para o autor do comunicado mais recente informando o conflito, com link para a página de resolução.
5. O conflito fica visível para admins na página de conflitos até ser marcado como resolvido.

### Agenda e presença
- Ao publicar um comunicado com obrigatorio=true, o sistema insere automaticamente registros em presencas com status=confirmado para todos os alunos pertencentes ao público-alvo.
- Alunos podem desmarcar qualquer evento da agenda (inclusive obrigatórios), mas devem fornecer justificativa com no mínimo 20 caracteres (valor configurável via admin/configuracoes).
- Eventos não obrigatórios dependem de ação explícita do aluno (opt-in).
- A agenda exibe apenas comunicados cujo data_fim ainda não passou.

### Visibilidade do comunicado
Um comunicado é exibido no feed do aluno se:
1. Seu status for publicado.
2. A data atual estiver entre data_inicio e data_fim.
3. O aluno pertencer ao público-alvo (verificado via publico_comunicado cruzado com curso_id, sala_id e turno do aluno).

---

## Páginas do frontend

### Área do aluno
- *Feed* — lista de comunicados ativos filtrados pelo perfil, ordenados por prioridade (urgente > alta > média > baixa). Badge de não lidos. Eventos obrigatórios com destaque visual.
- *Detalhe do comunicado* — texto completo, imagem, datas, botão de confirmar/desmarcar presença com campo de justificativa.
- *Agenda pessoal* — visualização em calendário mensal dos comunicados confirmados e obrigatórios.

### Área do grêmio
- *Editor de comunicado* — formulário de criação com todos os campos. Aviso de que a publicação depende de aprovação.
- *Meus comunicados* — lista dos comunicados criados com status visível (rascunho / aguardando / publicado / rejeitado). Motivo de rejeição exibido quando aplicável.
- *Painel de presenças* — para comunicados aprovados, lista de quem confirmou, quem desmarcou e as justificativas.

### Área do admin
- *Painel de aprovação* — fila de comunicados do grêmio aguardando revisão. Ações de aprovar ou rejeitar (com campo de motivo).
- *Todos os comunicados* — tabela com filtros de status, autor, período e público.
- *Página de conflitos* — lista de sobreposições detectadas. Cada item mostra os dois comunicados conflitantes lado a lado com opções de: descartar um, editar a data ou editar o público de qualquer dos dois.
- *Gestão de usuários* — CRUD de usuários, atribuição de papéis.
- *Configurações* — mínimo de caracteres da justificativa, habilitar/desabilitar grêmio.

---

## Fluxo resumido de publicação


Postador preenche comunicado
  └── É do grêmio?
       ├── Sim → status = aguardando_aprovacao
       │         Adm aprova? → Não → notifica rejeição (fim)
       │                     → Sim → continua abaixo
       └── Não (admin) → continua abaixo

Verifica conflito de datas + público
  └── Há sobreposição?
       ├── Sim → registra conflito, envia e-mail, exibe alerta na página de conflitos
       └── Não → publicado normalmente

Comunicado publicado (status = publicado)
  └── É obrigatório?
       ├── Sim → insere presença automática para todos do público-alvo
       └── Não → alunos confirmam presença por opt-in


---

## Stack sugerida

Não há obrigatoriedade de stack, mas o sistema foi pensado para:

- *Backend:* API REST com autenticação JWT. Qualquer linguagem/framework com suporte a ORM e filas de background (para e-mail e lógica de presença em massa).
- *Banco de dados:* PostgreSQL (recomendado para queries de interseção de intervalos com tsrange ou comparações de timestamps).
- *E-mail transacional:* SendGrid, Resend ou similar via variável de ambiente EMAIL_PROVIDER.
- *Frontend:* SPA com React ou framework similar. Biblioteca de calendário para a agenda do aluno.
- *Autenticação:* JWT com refresh token. Middleware de autorização por papel em cada rota.

---

## Variáveis de ambiente esperadas

env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=comunicados@escola.edu.br
MIN_JUSTIFICATIVA_CHARS=20
GREMIO_HABILITADO=true


---

## Observações para o Claude Code

- A detecção de conflito deve ser executada de forma transacional junto com a mudança de status do comunicado, garantindo consistência.
- A inserção em massa de presenças para comunicados obrigatórios pode envolver muitos registros — usar INSERT ... ON CONFLICT DO NOTHING ou equivalente para idempotência.
- A filtragem de comunicados por público-alvo do aluno deve ser eficiente — considerar índices em publico_comunicado(tipo, referencia_id) e nos campos de perfil do aluno.
- Todas as rotas de escrita devem validar que o usuário logado tem permissão sobre o recurso (ex: grêmio só edita os próprios rascunhos; admin edita qualquer um).
- O campo obrigatorio só pode ser definido por admins. Se um membro do grêmio enviar esse campo, deve ser ignorado ou retornar erro 403.