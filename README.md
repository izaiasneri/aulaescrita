📝 AulaEscrita

Um aplicativo de lousa digital moderno, leve e offline, desenvolvido especialmente para professores de Matemática e Ciências Exatas. O AulaEscrita simula uma folha de papel ou lousa digital infinita, oferecendo ferramentas precisas para escrever equações, resolver demonstrações, importar arquivos PDF e aplicar a metodologia do Modo Copiloto utilizando mesas digitalizadoras (como a UGEE M708).

✨ Principais Funcionalidades

**Escrita de Alta Precisão:** Reconhece pressão da caneta em mesas digitalizadoras.

**Cursor de Software Integrado:** O lápis permanece 100% visível durante o traço com a mesa digitalizadora (bypassa a ocultação nativa do Windows Ink).

**Importação de PDFs e Imagens:** Adicione listas de exercícios como plano de fundo flutuante.

**Tipos de Papel:** Fundo branco, pautado (caderno) ou quadriculado (ideal para geometria e gráficos).

**Exportação Prática:** Salve o quadro final mesclado (escrita + fundo) em PNG ou PDF.

**Sistema de Camadas:** A borracha apaga apenas a sua escrita, mantendo os PDFs e grades intactos.

**Versão Desktop Offline:** Pode ser compilado como um software nativo .exe para Windows.

🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando um ecossistema moderno de desenvolvimento web e desktop:

**Node.js:** O motor de execução que permite rodar as ferramentas de desenvolvimento JavaScript no computador.

**React:** Biblioteca para construir a interface de usuário (menus, botões, estado do aplicativo).

**TypeScript:** Um superconjunto do JavaScript que adiciona tipagem, tornando o código mais seguro e previsível.

**Vite:** Um empacotador de código ultra-rápido que prepara o projeto para rodar no navegador.

**HTML5 Canvas:** Tecnologia nativa utilizada para renderizar os traços da caneta e os desenhos na tela.

**Electron:** Framework que transforma o código web em um programa instalável para computador (Windows .exe).

**Bibliotecas auxiliares:** pdfjs-dist (leitura de PDF offline), jspdf (exportação), lucide-react (ícones) e Tailwind CSS (estilização).

🚀 Como baixar e executar este projeto

Este tutorial foi escrito para que qualquer pessoa (mesmo sem experiência avançada em programação) consiga baixar e rodar o projeto do zero.

**Passo 1:** Instalar os pré-requisitos

Antes de começar, você precisa ter dois programas gratuitos instalados no seu computador:

**Node.js:** Acesse nodejs.org e baixe a versão recomendada (LTS). Siga a instalação padrão (avançar, avançar e concluir).

**Visual Studio Code (VS Code):** Acesse code.visualstudio.com e baixe o editor de código.

**Passo 2:** Obter o código-fonte

Você pode obter os arquivos do projeto de duas formas:

**Opção A (Para iniciantes):** No topo desta página do GitHub, clique no botão verde "Code" e depois em "Download ZIP". Extraia a pasta no seu computador.

**Opção B (Via Terminal):** Se você usa Git, abra o terminal e clone o repositório:

```bash 
git clone https://github.com/SeuUsuario/aulaescrita.git


Passo 3: Abrir no VS Code e instalar as dependências

Abra o Visual Studio Code.

Vá no menu Arquivo > Abrir Pasta... (File > Open Folder) e selecione a pasta aulaescrita que você baixou.

Para abrir o terminal dentro do VS Code, pressione as teclas Ctrl + ` (control + crase) ou vá no menu Terminal > Novo Terminal.

No terminal, digite o comando abaixo e pressione Enter. Isso fará o Node.js baixar todas as bibliotecas necessárias para o projeto funcionar (como o React e o Electron):

npm install


Passo 4: Escolha como deseja rodar o projeto

Após a conclusão do npm install, você tem duas opções de execução:

Opção A: Rodar no Navegador (Modo de Desenvolvimento)

Ideal para testar ferramentas e fazer alterações no código em tempo real.
No terminal, digite:

npm run dev


O terminal exibirá um link (geralmente http://localhost:5173). Segure a tecla Ctrl e clique no link para abrir o aplicativo no seu navegador.
(Para parar o servidor, clique no terminal e pressione Ctrl + C).
