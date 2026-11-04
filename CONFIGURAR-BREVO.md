# Netlify → Brevo

Em Project configuration → Environment variables → Add a variable, cadastre:

| Key | Value |
| --- | --- |
| TURNSTILE_SECRET_KEY | Chave secreta do widget Cloudflare Turnstile |
| BREVO_API_KEY | Sua chave API v3 do Brevo (sem aspas) |
| BREVO_LIST_HOME | 28 |
| BREVO_LIST_BLOG | 29 |
| BREVO_LIST_GEOPOETICA | 30 |
| BREVO_LIST_FORNO_LATAO | 31 |
| BREVO_LIST_PRE_COLOMBIANO | 32 |
| BREVO_LIST_QUEIMAS_POETICAS | 33 |
| BREVO_LIST_POLITICAS_SOCIAIS | 34 |
| BREVO_LIST_CONTATO | 35 |

Scope: Functions (se a conta só oferece All scopes, use essa opção).
Deploy context: Production. Só habilite outros contextos se quiser que prévias também alimentem as listas reais.
Marque Contains secret values para BREVO_API_KEY e TURNSTILE_SECRET_KEY, se disponível. IDs não são segredos. Não envie a chave no chat nem a coloque em HTML ou JavaScript do navegador.

No Brevo, em atributos de contatos, crie NOME, SOBRENOME e TELEFONE_SITE, todos do tipo texto, exatamente com estes nomes. E-mail usa o campo padrão do Brevo. O telefone é guardado como texto para não associar automaticamente consentimento de SMS. Mensagens, modalidade de interesse e demais dados completos continuam em Netlify Forms.

## Publicação

Esta versão inclui a Edge Function turnstile-guard e a função brevo-forms. O simples upload da pasta estática pelo arrasta-e-solta não publica a integração.

- Use a pasta que contém netlify.toml como raiz do projeto conectado ao Git, ou faça deploy pela Netlify CLI com build.
- Build command: node scripts/build.mjs
- Publish directory: dist
- Functions directory: netlify/functions
- Habilite a detecção de formulários no Netlify e faça um novo deploy.
- Confirme que brevo-forms aparece nas Functions e turnstile-guard nas Edge Functions do deploy publicado. A guarda deve executar em POST /*; falhas bloqueiam o envio.
- Faça um envio real com um e-mail de teste autorizado em cada formulário, incluindo o CAPTCHA, e confira a lista correspondente no Brevo. Não foi feito envio real durante os testes locais.

Primeiro a Edge Function verifica o token Turnstile, seu hostname e a ação correspondente ao formulário. Somente depois encaminha o registro ao Netlify Forms, com uma assinatura vinculada aos dados do contato. O evento formSubmitted só sincroniza com o Brevo se essa assinatura for válida. O token bruto não fica armazenado. A função ignora formulários fora da lista, honeypot preenchido e ausência de consentimento. Em falhas temporárias tenta até 3 vezes. Em falha definitiva, o envio permanece no painel Forms; consulte o log da função e recupere o contato após corrigir a configuração. Não há fila própria de reprocessamento automático.

Atualiza contatos já existentes e adiciona a lista correspondente sem remover outras listas ou reativar descadastros. Não dispara campanhas. O formulário Contato autoriza resposta à mensagem; os formulários de curso autorizam contato sobre a formação. Pertencer a essas listas não autoriza automaticamente uma newsletter geral.

## Validação local

node --test tests/*.test.mjs
node scripts/build.mjs

Referências oficiais:
- https://docs.netlify.com/build/functions/environment-variables/
- https://docs.netlify.com/build/functions/trigger-on-events/
- https://developers.brevo.com/docs/synchronise-contact-lists

## Cloudflare Turnstile

Site key pública já integrada: 0x4AAAAAAFyz0vmm5nreHXuC.
Modo Managed; pre-clearance desativado. Autorize kuaraceramicas.com.br e os hostnames exatos utilizados para prévia (por exemplo previakuara.tauestudio.com.br e o subdomínio real netlify.app). A validação no servidor exige que o hostname do token coincida com o hostname que recebe o POST.
Cadastre TURNSTILE_SECRET_KEY no Netlify, escopo Functions (ou All scopes), contexto Production, como segredo, e faça novo build/deploy. Edge Functions usam os valores vigentes no deploy; editar a variável sem redeploy não basta. Só habilite segredos em outros contextos se pretende testar envios reais nessas prévias.
Não use SITE_RECAPTCHA_KEY ou SITE_RECAPTCHA_SECRET para esta integração. O reCAPTCHA foi retirado dos 12 formulários. O Turnstile admite widgets separados para os dois formulários das páginas antigas, mas os quatro formulários dessas páginas continuam apenas no Netlify Forms, sem listas Brevo atribuídas.
Na prévia localhost o envio é desativado; não há bypass para testar CAPTCHA em produção. Testes locais usam respostas simuladas e nunca enviam dados reais. Confirme no deploy: token ausente/inválido não gera registro nem contato; envio válido registra a mensagem e chega à lista correta; token repetido é recusado.
A assinatura interna tem validade de 7 dias para suportar eventos atrasados. A rotação da chave Turnstile invalida assinaturas pendentes; confira a fila de registros ao fazer a rotação. Confirmação de posse de e-mail (double opt-in) continua separada do CAPTCHA e não está implementada.

https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
https://docs.netlify.com/build/edge-functions/environment-variables/
