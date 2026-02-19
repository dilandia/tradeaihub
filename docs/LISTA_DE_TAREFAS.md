# Lista de Tarefas — Deploy TakeZ Plan + AIOS

Marque cada item conforme for concluindo.

---

## FASE 1: Enviar projeto para o VPS

- [ ] Abrir terminal no VS Code (Ctrl + `)
- [ ] `cd C:\Users\Diego\Documents\TakeZ-Plan`
- [ ] Rodar `.\scripts\1-enviar-projeto.ps1` OU o comando scp manual
- [ ] Conectar ao VPS: `ssh -i "$env:USERPROFILE\.ssh\hetzner_takez_new" takez@116.203.190.102`
- [ ] Verificar arquivos: `ls /home/takez/TakeZ-Plan/`

---

## FASE 2: Configurar e build no VPS

- [ ] `cd /home/takez/TakeZ-Plan`
- [ ] `npm install` (aguardar 2–5 min)
- [ ] Criar `.env.local`: `nano .env.local` (colar conteúdo do seu .env.local do PC)
- [ ] Salvar no nano: Ctrl+O, Enter, Ctrl+X
- [ ] `npm run build` (aguardar 2–5 min)
- [ ] `pm2 start npm --name takez-plan -- start`
- [ ] `pm2 save`
- [ ] `pm2 startup` (executar o comando que aparecer)

---

## FASE 3: Nginx

- [ ] Enviar script: `scp -i "$env:USERPROFILE\.ssh\hetzner_takez_new" scripts/3-nginx-vps.sh takez@116.203.190.102:/home/takez/`
- [ ] No VPS: `chmod +x 3-nginx-vps.sh && bash 3-nginx-vps.sh`
- [ ] Testar: abrir http://116.203.190.102 no navegador

---

## FASE 4: Instalar AIOS

- [ ] No seu PC: `cd C:\Users\Diego\Documents\TakeZ-Plan`
- [ ] `npx aios-core@latest install`
- [ ] Responder: TakeZ Plan, Core+Agent, npm, Claude Code
- [ ] Enviar AIOS para VPS: `scp -i "$env:USERPROFILE\.ssh\hetzner_takez_new" -r .aios-core .aios .claude .cursor takez@116.203.190.102:/home/takez/TakeZ-Plan/`

---

## FASE 5: Claude Code

- [ ] Criar/editar `C:\Users\Diego\.ssh\config` com o host takez-vps
- [ ] VS Code: Ctrl+Shift+P → Remote-SSH: Connect to Host → takez-vps
- [ ] Abrir pasta `/home/takez/TakeZ-Plan`
- [ ] Testar agente: digitar `/dev` ou `*help`

---

## Credenciais

- **SSH:** takez@116.203.190.102 (chave: hetzner_takez_new)
- **Senha takez:** qvZstYia0drblNYV
- **Ver:** CREDENCIAIS_VPS.txt
