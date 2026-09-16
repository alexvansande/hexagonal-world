# Imagens no Cloudflare R2

## Estado em 16 de setembro de 2026

O usuário aprovou incorporar iluminação nos mapas finitos e manter as camadas
separadas no infinito. As 42 combinações finitas iluminadas usam agora PNGs
diretamente, sem renderizar as camadas antigas por baixo. Political e Distortion
Analysis continuam usando suas imagens existentes. A iluminação incorporada
preserva os valores do preset; alterar fundo/opacidade usa a renderização ao vivo.

A zona Cloudflare está ativa no plano Free. O usuário alterou os servidores
na GoDaddy para `lia.ns.cloudflare.com` e `olof.ns.cloudflare.com`.
Os registros do site continuam apontando diretamente para o GitHub Pages.
R2 Standard está ativo, com bucket `hexagonal-earth-assets` e domínio público
`assets.hexagonal.earth` (HTTPS ativo, mínimo TLS 1.2). CORS permite o site e
o preview local. Cache de um ano aplica-se apenas aos caminhos de release
imutáveis; o código e sua configuração continuam no GitHub Pages.

As credenciais S3 ficam somente no arquivo local ignorado
`_asset-release/credentials.json`, com permissão 0600. O upload retoma arquivos
existentes sem sobrescrever conteúdo diferente, valida SHA-256 local e MD5/ETag
por envio, e compara tamanho/checksum de todos os objetos antes de publicar
o manifesto. `asset-release.json` fixa a URL e SHA-256 desse manifesto.

O upload completo foi verificado: 153.870 imagens conferidas por tamanho e
checksum. Com o manifesto, a release ocupa 5.502.827.694 bytes (5,50 GB) no R2.

## Pacote preparado

`node scripts/prepare-r2-assets.mjs` escreve o inventário em `_asset-release/`.
Não faz upload, não modifica o Git e não duplica as imagens. Inclui SHA-256 de
cada arquivo e uma lista explícita para cópia. Em 16 de setembro:

- Release: `maps-3447f2d8c47e5822`.
- 153.870 imagens, **5.473.411.939 bytes (5,47 GB)**.
- Inclui bases, iluminação do infinito, imagens finitas fundidas, fontes para
  personalização, rios, elevação, miniaturas, imagens sociais e ícones.
- Exclui iluminação finita substituída, o experimento fundido infinito, pirâmides
  de superfícies antigas sem referência no manifesto atual e imagens de testes.
- Arquivos excluídos do upload totalizam 10,37 GB localmente; isso inclui
  experimentos e NÃO equivale a 10,37 GB atualmente armazenados no GitHub.
- Antes da migração o Git acompanhava 32.386 imagens, somando cerca de 358 MB. A maior
  parte das novas pirâmides nunca foi adicionada ao Git.

O orçamento R2 Standard inclui 10 GB-mês, 1 milhão de operações de escrita e
10 milhões de operações de leitura por mês. Acima das franquias: US$ 0,015/GB-mês,
US$ 4,50/milhão de escritas e US$ 0,36/milhão de leituras. Egress gratuito.
Manter duas releases completas de 5,47 GB ultrapassaria a franquia de armazenamento;
o uso gratuito também depende das operações e dos demais arquivos da conta.
Fonte: https://developers.cloudflare.com/r2/pricing/ (consultada nesta data).

## Domínio e conta

1. Instalar/conectar a integração Cloudflare ou autenticar as ferramentas locais.
   Não inserir credenciais em código, arquivos versionados ou nesta documentação.
2. Adicionar `hexagonal.earth` à conta Cloudflare no plano gratuito. Conferir e
   copiar a zona DNS completa, especialmente registros de e-mail, verificações
   e GitHub Pages. Revisar DNSSEC antes de trocar servidores de nomes.
3. Na GoDaddy, alterar apenas os servidores de nomes pelos dois fornecidos para
   a zona. Registro, renovação e propriedade do domínio continuam na GoDaddy.
   Nesta migração, a alteração foi concluída e a zona está ativa.
4. Ativar R2 Standard e criar um bucket dedicado, por exemplo
   `hexagonal-earth-assets`. Qualquer aceite de cobrança fica com o titular.
5. Conectar `assets.hexagonal.earth` como domínio público do bucket. O domínio
   precisa pertencer à mesma conta Cloudflare. `r2.dev` serve para testes, não
   para o tráfego de produção. Não criar CNAME apontando para `r2.dev`.
6. Aplicar o CORS gerado, incluindo GET/HEAD dos domínios do site e do preview.
   Isso permite usar as imagens em WebGL/canvas e exportar PNG/PDF.

Documentação: https://developers.cloudflare.com/r2/buckets/public-buckets/
e https://developers.cloudflare.com/r2/buckets/cors/.

## Upload e verificação

O envio nesta migração usa `scripts/upload-r2-assets.py` com boto3 em ambiente
Python temporário. Resultado completo fica em `_asset-release/upload-result.json`.
Como alternativa, usar o protocolo S3 do R2 com rclone (documentado pelo Cloudflare), configurado
localmente com acesso limitado ao bucket. Exemplo, depois de autenticar o remoto
`r2` e criar o bucket:

```sh
rclone copy dist r2:hexagonal-earth-assets/maps-3447f2d8c47e5822 --files-from-raw _asset-release/files.txt --transfers 8 --header-upload 'Cache-Control: public, max-age=31536000, immutable'
rclone check dist r2:hexagonal-earth-assets/maps-3447f2d8c47e5822 --files-from-raw _asset-release/files.txt --one-way
```

Não usar `sync` com exclusão nem sobrescrever uma release publicada. Confirmar
quantidade, tamanho e integridade; verificar HTTPS, tipo de conteúdo, CORS e cache
pelo domínio público, além do acesso S3. Fazer upload do manifesto junto da
release para permitir auditoria e restauração. Credenciais nunca vão para o app.

## Preparar e publicar o site

Após validar o upload, executar em um diretório de saída novo:

```sh
MAP_ASSET_BASE_URL=https://assets.hexagonal.earth/maps-3447f2d8c47e5822 node scripts/build-external-site.mjs _site
```

O script prepara o site sem arquivos de imagem e ajusta imagens sociais, ícones,
miniaturas e carregadores para a release remota. Isso NÃO publica o site.
O preview local continua lendo as imagens locais com `assetBaseURL` vazio.

O workflow do GitHub Pages verifica o manifesto remoto pelo SHA-256 fixado,
baixa e confere os arquivos binários usados pelos testes, executa a suíte e
prepara o site sem imagens. As verificações de pirâmides usam o inventário
remoto em CI; execuções locais continuam verificando os arquivos locais.
A preparação pública contém aproximadamente 7,5 MB e nenhum arquivo de imagem.

Depois de testar a versão preparada contra o bucket real, retirar apenas as
cópias versionadas correspondentes com `git rm --cached`, preservando arquivos
locais e acrescentando regras de ignore específicas. Conferir o diff antes
do commit. Não reescrever o histórico. Publicar o app no GitHub Pages.
Manter a release remota anterior durante a janela de reversão; só apagar
arquivos locais antigos após confirmar que não há referências necessárias.

## Verificação concluída

- `npm test`, incluindo integridade das 42 pirâmides e orçamento de 120 texturas.
- 64 estilos/formatos no Chrome e Firefox: sem shaders de terreno ou downloads
  de elevação/rios globais ao abrir os padrões; recuperação de falha de imagem.
- Personalização, retorno aos padrões, memória e exportações em desktop e
  simulação de telefone/GPU de 2048 pixels no Chrome.
- Segundo servidor HTTP local simulando origem externa: mapas finitos e infinito,
  vista salva de Topographic, leitura de canvas e PNG/PDF no Chrome e Firefox.
- Bucket real: integridade completa, HTTPS, CORS e cache público verificados.
- Firefox usando o R2 real: mapas finitos/infinito, vista salva, leitura de canvas
  e exportações PNG/PDF aprovados; inspeção visual da vista salva concluída.

Scripts: `scripts/check-default-layers.mjs`, `scripts/check-map-performance.mjs`,
`scripts/check-external-assets.mjs`. Evidências temporárias em `/tmp/hex-cloud-*`.
