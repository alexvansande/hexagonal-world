"""Share byte-identical decoded region pyramids between the two matching layouts."""
from pathlib import Path
from PIL import Image
import json,shutil
root=Path(__file__).resolve().parent.parent/'dist/maps/default-layers/v1'
for style in (root/'bighex').iterdir():
 if not style.is_dir():continue
 target=root/'gosper'/style.name;old=target/'base'
 if not old.exists():continue
 for p in (style/'base').rglob('*.png'):
  q=old/p.relative_to(style/'base')
  if p.read_bytes()==q.read_bytes():continue
  with Image.open(p) as a,Image.open(q) as b:
   assert a.size==b.size and a.convert('RGB').tobytes()==b.convert('RGB').tobytes(),f'Different source pixels: {q}'
 entry=json.loads((target/'entry.json').read_text());entry['basePath']='v1/bighex/'+style.name+'/base'
 (target/'entry.json').write_text(json.dumps(entry));shutil.rmtree(old)
entries={str(p.parent.relative_to(root)):json.loads(p.read_text()) for p in root.glob('*/*/entry.json')}
(root.parent/'manifest.mjs').write_text('export default '+json.dumps({'version':1,'entries':entries})+';\n')
print('Identical Flower World / Gosper region pyramids shared; lighting remains separate.')
