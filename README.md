# Fullstack N8N Backend

Backend para aplicação fullstack utilizando Node.js, TypeScript, Express, N8N e PostgreSQL com descriptografia AES-256-GCM.

## 🚀 Funcionalidades

- **API RESTful** com Node.js e Express
- **Descriptografia AES-256-GCM** de dados criptografados
- **Integração com N8N** para automação de workflows
- **Validação de dados** com Joi
- **Logs estruturados** para monitoramento
- **Tratamento de erros**
- **Rate limiting** e segurança
- **CORS configurado** para frontend
- **TypeScript** para tipagem forte

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm ou yarn
- N8N configurado e rodando
- PostgreSQL configurado

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/lucasemanuel982/Full-stack-test-Back.git
cd fullstack-n8n-backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Configurações do Servidor
PORT=3001
NODE_ENV=development

# URL do endpoint com dados criptografados
ENCRYPTED_DATA_URL=url_dos_dados

# URL do webhook do N8N para envio dos dados
N8N_WEBHOOK_URL=http://localhost:5678/webhook/process-data

# URL do webhook do N8N para limpeza dos dados
N8N_CLEAR_WEBHOOK_URL=http://localhost:5678/webhook/clear-data

# Configurações de CORS
CORS_ORIGIN=http://localhost:3000

# Configurações de Log
LOG_LEVEL=info
```

4. **Compile o TypeScript**
```bash
npm run build
```

5. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 API Endpoints

### Base URL
```
http://localhost:3001/api
```

### Endpoints Disponíveis

#### 1. Executar Fluxo de Dados
```http
POST /api/data/execute
```

**Descrição:** Executa o fluxo completo:
1. Busca dados criptografados do endpoint externo
2. Descriptografa usando AES-256-GCM
3. Envia dados para N8N
4. N8N salva no PostgreSQL


#### 2. Limpar Dados
```http
POST /api/data/clear
```

**Descrição:** Limpa a tabela `users` no PostgreSQL via N8N

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Dados limpos com sucesso"
}
```

#### 3. Health Check
```http
GET /api/data/health
```

**Descrição:** Verifica o status dos serviços

#### 4. Informações da API
```http
GET /api/data/info
```

**Descrição:** Retorna informações detalhadas sobre a API


##  Estrutura do Projeto

```
src/
├── config/           # Configurações da aplicação
├── controllers/      # Controladores das rotas
├── middleware/       # Middlewares personalizados
├── routes/          # Definição das rotas
├── services/        # Serviços de negócio
├── types/           # Definições de tipos TypeScript
├── utils/           # Utilitários
├── app.ts           # Configuração da aplicação Express
└── index.ts         # Ponto de entrada da aplicação
```


## Logs

A aplicação utiliza logs estruturados com diferentes níveis:

- **ERROR**: Erros críticos
- **WARN**: Avisos importantes
- **INFO**: Informações gerais
- **DEBUG**: Informações detalhadas (apenas em desenvolvimento)

## Testando a API


### Usando Postman

1. Importe a collection (se disponível)
2. Configure a base URL: `http://localhost:3001/api`
3. Execute os endpoints conforme necessário

## 🚀 Deploy

### Variáveis de Ambiente para Produção

```env
NODE_ENV=production
PORT=3001
ENCRYPTED_DATA_URL=url_dos_dados
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/process-data
N8N_CLEAR_WEBHOOK_URL=https://seu-n8n.com/webhook/clear-data
CORS_ORIGIN=https://seu-frontend.com
LOG_LEVEL=info
```
