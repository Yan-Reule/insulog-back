# Vinculo medico-paciente

O modelo atual permite um medico para cada paciente. A coluna `paciente.id_medico` referencia `medico.id_usuario`; varios pacientes podem apontar para o mesmo medico.

## Preparar o banco

Aplique as duas migracoes, nesta ordem, no banco Insulog existente:

```powershell
Get-Content .\src\config\medical-link-schema.sql | mysql -h $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER -p $env:DB_NAME
Get-Content .\src\config\unlinked-patient-schema.sql | mysql -h $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER -p $env:DB_NAME
```

As migracoes criam `codigo_vinculo_medico` e permitem `NULL` em `paciente.id_medico`. Nao modificam os vinculos existentes; novos pacientes podem permanecer sem medico.

## Segredo de autenticacao

Configure `AUTH_TOKEN_SECRET` no `.env` do backend com um valor aleatorio e persistente. Mantenha o mesmo valor entre reinicializacoes e nao o compartilhe nem versione. Em producao, a API nao inicia sem esse segredo.

Para gerar um valor no PowerShell:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

## Fluxo

1. O paciente cria a conta no mobile sem precisar de codigo; `paciente.id_medico` fica nulo.
2. Depois de entrar, o paciente abre **Opcoes > Vincular medico**. `GET /pacientes/vinculo` informa o estado atual e `POST /pacientes/vinculo` recebe o codigo.
3. O medico autenticado chama `POST /medicos/vinculos`. A API retorna `INSU-XXXXXXXX`, valido por 24 horas e de uso unico.
4. O resgate consome o convite e atualiza `paciente.id_medico` na mesma transacao.
5. O portal usa `GET /medicos/pacientes`, `GET /medicos/pacientes/:id` e `GET /medicos/pacientes/:id/registros`. Cada rota verifica o token e confirma `paciente.id_medico` com o medico autenticado.
6. Depois que o paciente concluir o vinculo, o medico atualiza a lista pelo botao **Atualizar**.

O codigo e armazenado como hash, nao como texto legivel. O cadastro nao exige nem aceita um `id_medico` enviado pelo app.
