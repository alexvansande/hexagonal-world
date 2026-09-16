# Experimento: mapas com iluminação incorporada

16 de setembro de 2026. Resultado local para revisão; não publicado.

Foram geradas 48 combinações iluminadas (seis estilos × oito formatos).
As 16 combinações de Political e Distortion Analysis já não têm iluminação
separada e reutilizam seus arquivos. Todas as imagens atuais foram preservadas.

## Tamanho medido

GB decimal; bytes reais dos arquivos, não espaço reservado pelo sistema de arquivos.
As bases sem iluminação são mantidas nos dois cenários. Uma economia negativa
significa aumento de espaço. A coluna de arquivos substituíveis inclui também
as imagens temporárias do teste anterior de resolução.

| Conjunto | Imagens novas | Iluminação antiga substituível | Economia líquida |
|---|---:|---:|---:|
| Sete formatos finitos | 2,78 GB | 4,97 GB | 2,19 GB |
| Infinite Honeycomb | 5,34 GB | 1,60 GB | -3,73 GB |
| Total | 8,12 GB | 6,57 GB | -1,55 GB |

| Formato | Imagens novas | Iluminação antiga |
|---|---:|---:|
| Spaceship Earth | 0,42 GB | 1,01 GB |
| Felv | 0,38 GB | 0,50 GB |
| Flower World | 0,64 GB | 0,94 GB |
| Gosper Fractal | 0,64 GB | 0,88 GB |
| 4Hexes | 0,37 GB | 0,58 GB |
| Rus One | 0,11 GB | 0,54 GB |
| Rus Two | 0,22 GB | 0,52 GB |
| Infinite Honeycomb | 5,34 GB | 1,60 GB |

Biblioteca atual de camadas padrão: **7,34 GB**.
Adotar todas as imagens novas e retirar toda a iluminação antiga deixaria essa
biblioteca em aproximadamente **8,89 GB**.
Esses números não incluem os outros recursos do site, que continuam necessários.

## Interpretação

Nos formatos finitos, a fusão economiza espaço. No infinito, as cores que antes
eram reutilizadas por várias peças ficam repetidas na imagem do período completo;
isso aumenta o volume. A recomendação é avaliar a fusão nos formatos finitos e
manter o infinito separado enquanto estudamos uma representação mais compacta.

## Como comparar

Abra um mapa local acrescentando `?merged-preview=1` antes do `#` no endereço.
A caixa “Novas imagens com iluminação incorporada” alterna entre os PNGs novos
e as camadas atuais, mantendo o enquadramento. Aguarde a indicação de imagens
prontas. O teste não altera links compartilhados nem os padrões do site normal.

Grades, linhas e demais sobreposições continuam independentes. Os PNGs incorporam
o fundo e as opacidades do preset; personalizar esses valores sai do experimento.
As bases sem iluminação permanecem disponíveis, mas a transição ajustável entre
as duas versões ainda não foi implementada. A prévia mantém o renderizador antigo
para comparação; não deve ser usada como medição final de desempenho.

## Limites e remoção futura

Verificação concluída: suíte `npm test`; 48 combinações iluminadas nas vistas
completas em Chrome e Firefox; seis estilos de Spaceship Earth no close-up salvo
em ambos os navegadores; integridade, dimensões e bordas dos 109.458 PNGs novos.
Foram inspecionadas também capturas das vistas completas e aproximadas. Esses
testes verificam o funcionamento da comparação, não substituem a aprovação visual.

Nenhum arquivo atual pode ser removido do aplicativo ainda: o caminho normal
continua referenciando a biblioteca antiga. Os valores acima são candidatos para
depois da aprovação visual, adoção das novas imagens e definição do caminho para
personalizações. Não remover fontes de elevação, rios ou mapas usados pelo modo
personalizado com base nestes números.

Lifezones fora de Spaceship Earth conserva a iluminação geral já existente;
esses formatos ainda não tinham iluminação detalhada preparada. A fusão não
inventa detalhe. A reamostragem e a ordem de composição podem produzir pequenas
diferenças, por isso a aprovação visual do experimento continua pendente.

Dados detalhados: `dist/maps/merged-experiment/size-report.json`.
