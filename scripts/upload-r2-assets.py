"""Upload the explicit public image release, resume safely, and verify every object.

Credentials are read only from the ignored local file and never printed.
Requires boto3. No deletes, bucket changes, or website publication.
"""
import concurrent.futures as futures
import hashlib
import json
import mimetypes
from pathlib import Path
import time
import os
import sys
import boto3
from botocore.config import Config

root = Path(__file__).resolve().parent.parent
release_dir = (root / sys.argv[1]).resolve() if len(sys.argv) > 1 else root / '_asset-release'
credentials = json.loads((root / '_asset-release' / 'credentials.json').read_text())
manifest = json.loads((release_dir / 'manifest.json').read_text())
workers = int(os.environ.get('R2_UPLOAD_WORKERS', '96'))
bucket = 'hexagonal-earth-assets'
prefix = manifest['release'] + '/'
client = boto3.client('s3', endpoint_url='https://878c341bd68f0758e52e3d409ade21de.r2.cloudflarestorage.com',
    aws_access_key_id=credentials['accessKeyId'].strip(),
    aws_secret_access_key=credentials['secretAccessKey'].strip(),region_name='auto',
    config=Config(signature_version='s3v4', max_pool_connections=workers,
                  retries={'max_attempts': 8, 'mode': 'adaptive'},
                  connect_timeout=15, read_timeout=90))

def listing():
    result = {}
    for page in client.get_paginator('list_objects_v2').paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get('Contents', []):
            result[obj['Key'][len(prefix):]] = (obj['Size'], obj['ETag'].strip('"'))
    return result

existing = listing()  # Validates credentials before opening upload workers.
print(json.dumps({'release':manifest['release'],'total':len(manifest['files']),'existing':len(existing)}), flush=True)
expected = {}
def upload(item):
    path = item['path']
    data = (root / 'dist' / path).read_bytes()
    if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
        raise RuntimeError('Local inventory mismatch: ' + path)
    md5 = hashlib.md5(data).hexdigest()
    expected[path] = (len(data), md5)
    if path in existing:
        if existing[path] != expected[path]:
            raise RuntimeError('Refusing to overwrite a different existing object: ' + path)
        return len(data), False
    response = client.put_object(Bucket=bucket, Key=prefix+path, Body=data,
        ContentType=mimetypes.guess_type(path)[0] or 'application/octet-stream',
        CacheControl='public, max-age=31536000, immutable', Metadata={'sha256':item['sha256']})
    if response['ETag'].strip('"') != md5:
        raise RuntimeError('Upload checksum mismatch: ' + path)
    return len(data), True

start = last = time.monotonic()
done = byte_count = uploaded = 0
with futures.ThreadPoolExecutor(max_workers=workers) as pool:
    # Bound outstanding work as well as concurrent connections.
    for offset in range(0, len(manifest['files']), workers*8):
        jobs = [pool.submit(upload, item) for item in manifest['files'][offset:offset+workers*8]]
        for job in futures.as_completed(jobs):
            size, sent = job.result()
            done += 1; byte_count += size; uploaded += int(sent)
            if time.monotonic() - last >= 15:
                last = time.monotonic()
                print(json.dumps({'done':done,'total':len(manifest['files']),'bytes':byte_count,
                    'uploaded':uploaded,'seconds':round(last-start)}), flush=True)

remote = listing()
bad = [path for path, value in expected.items() if remote.get(path) != value]
if bad:
    raise RuntimeError('Remote verification failed for '+str(len(bad))+' images')
# Publish the inventory only once all images have passed full size/MD5 comparison.
payload = (release_dir / 'manifest.json').read_bytes()
client.put_object(Bucket=bucket,Key=prefix+'manifest.json',Body=payload,
    ContentType='application/json',CacheControl='public, max-age=31536000, immutable')
result={'release':manifest['release'],'verifiedImages':len(expected),'bytes':byte_count,
    'newUploads':uploaded,'elapsedSeconds':round(time.monotonic()-start),'verified':True}
(release_dir / 'upload-result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result),flush=True)
