# Infinite Honeycomb: investigação de representação e desempenho

16 de setembro de 2026. Somente diagnóstico; nenhum comportamento, imagem,
configuração de hospedagem ou publicação foi alterado nesta investigação.

## Recomendação

**Não substituir agora o infinito inteiro pela fusão retangular de 5,34 GB.**
Manter a representação separada enquanto avaliamos um candidato compacto:
reutilização das bases nas vistas amplas e imagens fundidas locais nos close-ups,
armazenadas no período mínimo do padrão. Um cache limitado de composição de tiles
é outra opção para comparar, sem calcular relevo durante a navegação padrão.

A hipótese de que fundir ajuda o visitante é parcialmente confirmada: no close-up
houve menos dados e menos imagens para decodificar em alguns estilos, além do
potencial de reduzir texturas e eliminar a composição. Mas a vista ampla e a
navegação lateral frequentemente pioram. Biblioteca menor, número de camadas e
experiência de uso não são medidas intercambiáveis.

## Como foi medido

- Chrome headless 152, ANGLE/Metal, Apple M1 Max, janela 1440 × 1000, DPR 1.
- Satellite, Lifezones e Elevation; 200, 800 e 2400 pixels CSS por unidade de mapa
  (zoom 1, 4 e 12 com escala 200), mesma posição inicial.
- Contexto novo para cada carregamento frio; deslocamento lateral de 600 pixels;
  retorno à posição original; recarga com cache HTTP quente.
- Dados de Resource Timing, com buffer ampliado para não truncar requisições.
  Tabelas contam apenas PNGs completos das camadas, em MB decimais. Excluem código,
  miniaturas, cabeçalhos HTTP e índices: o índice atual tem 0,167 MB, e o índice
  experimental de todos os mapas tem 0,882 MB, sem compressão HTTP neste servidor.
- Na prévia, foram contadas **somente as requisições das imagens novas**. A prévia
  também executa o renderizador antigo; seu tempo de quadro e memória total não
  foram usados como desempenho de uma implementação fundida definitiva.
- O custo da composição atual foi isolado em sessões diagnósticas descartáveis,
  alternando 75 quadros normais e 75 sem a chamada de composição. Medimos CPU do
  callback de desenho e GPU via `EXT_disjoint_timer_query`. Essa variante sem
  composição não é uma solução visual correta; serve apenas para medir seu custo.

Não são tempos de carregamento em conexão real, nem resultados de um celular.
O navegador usa os níveis adaptativos existentes; as duas representações não
possuem exatamente o mesmo detalhe de iluminação em todos os enquadramentos.
Lifezones infinito só tem iluminação geral na biblioteca atual. Não houve erro
JavaScript nos 18 casos de carregamento observados.

## Dados baixados pelo visitante

| Estilo | Escala da vista | Separadas: entrada fria | Fundidas: entrada fria | Separadas: pan adicional | Fundidas: pan adicional |
|---|---|---:|---:|---:|---:|
| Satellite | Ampla | 5,18 MB | 11,05 MB | 0 | 4,24 MB |
| Satellite | Intermediária | 11,75 MB | 8,94 MB | 2,06 MB | 5,58 MB |
| Satellite | Close-up | 6,46 MB | 1,82 MB | 0,62 MB | 0,48 MB |
| Lifezones | Ampla | 6,35 MB | 9,09 MB | 0 | 3,49 MB |
| Lifezones | Intermediária | 7,21 MB | 5,58 MB | 0,41 MB | 3,98 MB |
| Lifezones | Close-up | 6,57 MB | 2,71 MB | 0,04 MB | 0,92 MB |
| Elevation | Ampla | 6,47 MB | 12,11 MB | 0 | 4,61 MB |
| Elevation | Intermediária | 11,82 MB | 9,08 MB | 1,73 MB | 5,53 MB |
| Elevation | Close-up | 8,44 MB | 3,50 MB | 0,72 MB | 1,67 MB |

Em todas as vistas amplas, as separadas carregaram 24 PNGs e as fundidas 81.
No close-up de Satellite foram 50 versus 17; no de Lifezones, 38 versus 43.
Menos camadas não implica necessariamente menos requisições.

O retorno imediato não transferiu novas imagens em nenhum caso. Na recarga
quente, todos os PNGs vieram do cache HTTP, com transferência de rede zero.
A recarga ainda precisa reconstruir texturas e possivelmente decodificar imagens;
cache HTTP não equivale ao cache de texturas já presentes na GPU. Um trajeto mais
longo pode exceder os limites dos caches e mudar esses resultados.

Hoje o caminho separado solicita também as imagens gerais de iluminação do
período completo, mesmo em close-up: cerca de 3,67 MB em Satellite, 5,61 MB em
Lifezones e 5,25 MB em Elevation. Uma parte importante da vantagem inicial da
fusão vem de evitar esse carregamento, e não apenas de evitar multiplicações na GPU.
Tornar essa iluminação geral mais progressiva/recortada merece comparação.

## Desenho e memória

Nesta máquina, retirar a composição poupou aproximadamente **0,09–0,67 ms de
GPU por quadro** e **0–0,3 ms de CPU nas medianas**. O caminho atual faz uma cópia
da tela, uma composição geral e, quando aplicável, uma composição por tile fino.
Em Satellite intermediário foram 106 chamadas de desenho com composição e 75
sem ela. São operações sobre imagens prontas; não é cálculo de sombras do relevo.

Lifezones amplo levou cerca de 15,9 ms de CPU por quadro com composição e 15,8 ms
sem ela. Esse custo está quase todo fora do compositor. Portanto, eliminar as
camadas não resolveria sozinho esse caso. O renderizador já desenha sob demanda,
não recalcula continuamente a iluminação enquanto o mapa está parado.

A soma lógica das texturas atuais, estimada a 4 bytes por pixel, ficou entre
32 e 60 MiB nos casos observados, incluindo a cópia da tela. Isso não é uma leitura
da memória física do driver. Os PNGs novos solicitados no carregamento frio
equivalem a aproximadamente 19–20 MiB decodificados nas vistas ampla/intermediária
e 3,7–9,4 MiB nos close-ups. Um renderizador fundido independente poderia evitar
a cópia de tela e parte das texturas atuais. O protótipo presente ainda retém os
dois caminhos, Canvas 2D e uma textura de tela adicional; não entrega essa economia.

Não compor o período inteiro em uma textura gigante: a versão de 36.864 × 21.284
pixels exigiria aproximadamente **2,92 GiB apenas para RGBA**. Qualquer cache de
composição precisa operar em tiles visíveis, com limite e descarte explícitos.

## Reaproveitamento que realmente existe

`tiling.mjs` contém 36 células no período axial 6 × 6, usando quatro regiões de
cor e **12 combinações efetivamente presentes de região/orientação**. O retângulo
atual de 18 × 10,392 unidades contém dois períodos primitivos, ou 72 hexágonos.
O padrão também se repete pelos vetores (9; 5,196) e (0; 10,392) no plano geométrico.

É possível representar um período menor com repetição deslocada: ao atravessar
uma borda horizontal, a coordenada vertical também muda. Não é simplesmente
encolher a imagem e continuar usando o `fract` independente dos dois eixos.
Os PNGs existentes que intersectam a metade esquerda somam **2,674 GB**, contra
5,339 GB do conjunto infinito fundido. Isso mede arquivos já existentes, não um
novo conjunto pronto: gutters, níveis pequenos, fase de amostragem e continuidade
nas emendas ainda precisam ser preparados e verificados. A redução aproximada
pela metade não basta para ficar abaixo dos 1,60 GB de iluminação separada.

**Uma peça iluminada por orientação não é automaticamente reutilizável inteira.**
Os 36 lugares têm 34 combinações distintas de região/orientação/padrão de emendas
e 35 quando incluímos os seis vizinhos. O renderer usa essas emendas no campo de
altura e usa vizinhos para oclusão, normais e sombras. O alcance máximo calculado
é aproximadamente 0,17 unidade em Gentle, 0,50 em Sculpted e 1,24 em Dramatic,
comparado ao raio 1 do hexágono. Em Dramatic, não podemos presumir sequer que
toda a parte central independe dos vizinhos.
O limite de padding pode encurtar esse alcance em níveis de detalhe altos;
os números acima são limites do modelo, não uma medição uniforme em todo zoom.

Amostras das camadas já geradas em peças de mesma orientação também não foram
idênticas. Parte da diferença pode ser fase de rasterização/interpolação; esse
teste não atribui toda diferença aos vizinhos. Ele reforça que juntar variantes
exige validação visual e numérica, não apenas agrupar pelo ID da região.

## Compor uma vez e reutilizar em memória

É tecnicamente viável compor os PNGs existentes em pequenos alvos de renderização,
guardar o resultado e reutilizá-lo durante o pan. Isso usa mistura simples de
imagens, sem buscar elevação nem executar horizonte/sombras. A chave do cache
precisa incluir preset, nível, posição canônica no período, versões das fontes e
valores que alteram a mistura. Rotação local e contexto de vizinhança não podem
ser ignorados. Alterar cor de fundo ou opacidades invalida os resultados afetados;
mudar geometria ou iluminação física exige o caminho personalizado apropriado.

O benefício não é garantido: construir o tile custa uploads e uma passagem extra;
reter simultaneamente fontes e resultados pode aumentar memória. Ele só compensa
se houver reutilização suficiente. Para uma vista parada, já não há composição
contínua a eliminar. Opacidades de escuro e claro também não são reproduzidas
independentemente por um simples fade entre apenas duas imagens prontas.

## Menor próximo experimento

Um teste independente, sem manter o renderizador antigo por baixo, apenas para
Satellite e Lifezones, comparando a mesma qualidade e o mesmo trajeto:

1. Separadas com iluminação geral carregada de forma mais localizada.
2. Período primitivo fundido, com quatro bases reutilizadas na vista ampla e
   tiles fundidos apenas no detalhe.
3. As mesmas fontes separadas, compostas uma vez por tile em um cache limitado.

Medir entrada ampla e direta em close-up, vários pans que excedam o cache, retorno,
zoom, bytes de rede, tempo até a imagem útil, p95 de quadro e memória de fontes
mais resultados. Incluir celular real/modesto e Firefox, não apenas esta GPU.
Verificar fronteiras do período e mudanças de opacidade. Só então escolher qual
opção compensa para o visitante. Nenhuma dessas mudanças foi implementada aqui.

Dados brutos desta investigação estão em `diagnostics/infinite-rendering/`.
