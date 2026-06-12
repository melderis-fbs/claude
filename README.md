# Biblioteca de Clientes · Founders BS

## Setup

### 1. Notion API
1. Andá a [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Creá una nueva integración → copiá el token (`secret_...`)
3. En la base **Biblioteca de Clientes**: `···` → **Connections** → agregar integración

### 2. Variables de entorno
```bash
cp .env.local.example .env.local
# Editá con tu NOTION_TOKEN
```

### 3. Dev
```bash
npm install && npm run dev
```

### 4. Deploy Vercel
Agregar env vars: `NOTION_TOKEN` y `NOTION_DATABASE_ID=9b9d68a732f741e6970e2aa0e98804bc`

## Propiedades Notion
| Propiedad | Tipo |
|-----------|------|
| Nombre | Title |
| Profesión | Text |
| Negocio | Text |
| A quién ayuda | Text |
| Nicho | Select |
| Instagram | URL |
| Email | Email |
| Caso de éxito | Checkbox |
| Testimonio | URL |
