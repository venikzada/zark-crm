# Padrão de Identidade Visual e Desenvolvimento - Zark CRM

Este documento define as diretrizes obrigatórias de identidade visual, UX/UI e padrões de desenvolvimento para o sistema Zark CRM. Todos os módulos, novas funcionalidades e refatorações devem seguir rigorosamente estas especificações.

## 1. Princípios Gerais

- **Consistência:** A identidade visual deve ser mantida em todas as telas e componentes.
- **Profissionalismo:** O design deve transmitir confiança e robustez.
- **Idioma:** O sistema é nativamente em **Português do Brasil (pt-BR)**.
- **Tecnologia:** Utilização de **Tailwind CSS** para estilização e **Shadcn/ui** como base de componentes.

---

## 2. Paleta de Cores

A cor primária da marca é o Laranja Zark, que deve ser utilizado para ações principais, destaques e elementos de marca.

### Cores Institucionais
- **Laranja Zark (Principal):** `#FF6B35` (Usar para botões primários, estados ativos, destaques)
- **Laranja Dark (Hover/Active):** `#d45a00` (Ou variação calculada para hover)
- **Laranja Light (Backgrounds sutis):** `#ff8c42`

### Cores de Interface (Tema Escuro - Padrão)
- **Background:** `oklch(0.12 0 0)` (Cinza muito escuro/preto suave)
- **Surface/Card:** `oklch(0.16 0 0)`
- **Border:** `oklch(1 0 0 / 10%)`
- **Foreground (Texto):** `oklch(0.985 0 0)` (Branco/Gelo)
- **Muted Foreground:** `oklch(0.65 0 0)` (Cinza médio para textos secundários)

### Regras de Aplicação
1.  **NUNCA** usar cores "hardcoded" (ex: `red`, `blue`, `#000`). Utilize as variáveis CSS (var(--primary), var(--background)) ou classes do Tailwind (`bg-primary`, `text-muted-foreground`).
2.  **Contraste:** Garanta sempre o contraste adequado para acessibilidade entre texto e fundo.

---

## 3. Tipografia

A tipografia oficial do sistema é a família **Geist**.

- **Fonte Principal (Sans):** `Geist Sans` (Interface, textos, títulos)
- **Fonte Monospace (Code):** `Geist Mono` (Snippets de código, dados tabulares técnicos)

### Pesos e Tamanhos
- **Títulos:** Bold ou Semibold.
- **Corpo de Texto:** Regular ou Medium.
- **Tamanhos:** Utilizar a escala do Tailwind (`text-sm`, `text-base`, `text-lg`, `text-xl`).
    - Padrão para interface densa: `text-sm` (14px).
    - Títulos de seção: `text-lg` ou `text-xl`.

---

## 4. Iconografia

A iconografia deve ser limpa, profissional e consistente.

- **Biblioteca Padrão:** **Lucide React**.
- **Regra CRÍTICA:** **PROIBIDO O USO DE EMOJIS** COMO ÍCONES DE INTERFACE.
    - ❌ Não usar: 🏠, 👤, ⚙️
    - ✅ Usar: `<Home />`, `<User />`, `<Settings />` (componentes Lucide)
- **Estilo:** Stroke width padrão (geralmente 2px ou 1.5px), cantos arredondados.
- **Tamanho:** Padrão `size-4` (16px) ou `size-5` (20px) para interface geral.

---

## 5. UI e Componentes

O sistema utiliza componentes baseados em **Shadcn/ui**.

### Estilização
- **Bordas Arredondadas (Radius):** `0.625rem` (aprox. 10px - `rounded-lg` ou `rounded-[0.625rem]`).
- **Sombras e Efeitos:**
    - Utilizar classes utilitárias para efeitos visuais como `.glass` (efeito vidro) e `.glow-zark` para destaques.
    - Animações sutis são encorajadas (`hover-lift`, `animate-slide-up`) para dar vida à interface.

### Componentes Padrão
- **Botões:** Devem ter feedback visual claro (hover, active).
- **Cards:** Fundo sutilmente mais claro que o background principal, com borda sutil.
- **Inputs:** Devem ter foco visível com a cor primária (`ring-primary`).

---

## 6. Padrões de Layout e Espaçamento

- **Grid/Flexbox:** Utilizar Flexbox e Grid do Tailwind para diagramação.
- **Espaçamento:** Seguir a escala do Tailwind (`gap-4`, `p-6`, `m-2`).
    - Espaçamento padrão entre cartões/seções: `gap-6` (24px) ou `gap-8` (32px).
    - Padding interno de cartões: `p-6` (24px).

---

## 7. Internacionalização (i18n)

- **Idioma Único:** Todo o texto visível ao usuário deve estar em **Português do Brasil**.
- **Datas:** Formato `dd/MM/yyyy` (ex: 25/10/2024).
- **Moeda:** Real Brasileiro `R$` (ex: R$ 1.250,00).

---

## 8. Desenvolvimento e Código

- **Framework:** Next.js (App Router).
- **Linguagem:** TypeScript.
- **Estilização:** Tailwind CSS (evitar CSS puro ou `style={{}}` inline, exceto para valores dinâmicos).
- **Gerenciamento de Estado:** React Server Actions p/ mutações, Context/Zustand p/ estado global se necessário.

---

*Este documento deve ser consultado e seguido por todos os desenvolvedores do projeto Zark CRM.*
