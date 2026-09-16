"""Measure actual file bytes, including shared unlit bases only once."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
old=root/'dist/maps/default-layers/v1'
new=root/'dist/maps/merged-experiment'
def size(folder):return sum(p.stat().st_size for p in folder.rglob('*') if p.is_file() and p.name!='size-report.json')
rows=[]
for folder in sorted(old.glob('*/*')):
    marker=folder/'entry.json'
    if not marker.exists():continue
    entry=json.loads(marker.read_text());key=str(folder.relative_to(old))
    if not entry.get('lighting'):continue
    lighting=size(folder/'light')+size(folder/'detail')
    merged=size(new/key)
    complete=(new/key/'entry.json').exists()
    rows.append(dict(key=key,lightingBytes=lighting,mergedBytes=merged,complete=complete,netSavingBytes=lighting-merged))
totals=dict(oldDefaultLibraryBytes=size(old),newMergedBytes=size(new),replaceableLightingBytes=sum(r['lightingBytes'] for r in rows),complete=sum(r['complete'] for r in rows),expected=len(rows))
totals['netSavingKeepingUnlitBytes']=totals['replaceableLightingBytes']-totals['newMergedBytes']
totals['projectedDefaultLibraryBytes']=totals['oldDefaultLibraryBytes']-totals['replaceableLightingBytes']+totals['newMergedBytes']
report=dict(units='bytes; GB = 1,000,000,000 bytes',totals=totals,rows=rows,note='Potential removal only after replacement adoption and custom-opacity handling. Current app still references all old assets. New library retains fixed preset backgrounds; unlit bases remain available separately.')
(new/'size-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(totals,indent=2))
for layout in sorted({r['key'].split('/')[0] for r in rows}):
    group=[r for r in rows if r['key'].startswith(layout+'/')]
    print(layout, 'new GB',round(sum(r['mergedBytes'] for r in group)/1e9,3),'old lighting GB',round(sum(r['lightingBytes'] for r in group)/1e9,3))
if totals['complete']==totals['expected']:
    names={'dymaxion':'Spaceship Earth','felv':'Felv','bighex':'Flower World','gosper':'Gosper Fractal','flower':'4Hexes','single':'Rus One','double':'Rus Two','infinite':'Infinite Honeycomb'}
    gb=lambda n:f'{n/1e9:.2f}'.replace('.',',')+' GB'
    finite=[r for r in rows if not r['key'].startswith('infinite/')]
    infinite=[r for r in rows if r['key'].startswith('infinite/')]
    table=[]
    for label,group in [('Sete formatos finitos',finite),('Infinite Honeycomb',infinite),('Total',rows)]:
        old_bytes=sum(r['lightingBytes'] for r in group);new_bytes=sum(r['mergedBytes'] for r in group)
        table.append(f'| {label} | {gb(new_bytes)} | {gb(old_bytes)} | {gb(old_bytes-new_bytes)} |')
    detail=[]
    for layout,label in names.items():
        group=[r for r in rows if r['key'].startswith(layout+'/')]
        detail.append(f'| {label} | {gb(sum(r["mergedBytes"] for r in group))} | {gb(sum(r["lightingBytes"] for r in group))} |')
    text='''# Experimento: mapas com iluminação incorporada

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
'''+ '\n'.join(table)+'''

| Formato | Imagens novas | Iluminação antiga |
|---|---:|---:|
'''+ '\n'.join(detail)+f'''

Biblioteca atual de camadas padrão: **{gb(totals['oldDefaultLibraryBytes'])}**.
Adotar todas as imagens novas e retirar toda a iluminação antiga deixaria essa
biblioteca em aproximadamente **{gb(totals['projectedDefaultLibraryBytes'])}**.
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
'''
    (root/'MERGED-MAPS-EXPERIMENT.md').write_text(text)
