# find any string in quotes (" or ') in a file

import argparse
from glob import glob
import json
import os
from pathlib import Path
import re
import logging
import hashlib

import paramiko
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# color error red
logging.addLevelName(logging.ERROR, "\033[1;31m%s\033[1;0m" % logging.getLevelName(logging.ERROR))

logger = logging.getLogger(__name__)

ROOT = Path(os.path.abspath(__file__)).parent.parent
ASSETS_JSON_PATH = ROOT / 'src' / 'assets' / 'assets.json'
ASSET_EXTENSIONS = ['.png', '.gltf', '.glb', '.jpg', '.jpeg', '.svg', '.ogg', '.mp3', '.wav', '.flac' ]

SFTP_USERNAME = os.environ.get('JS_ZERO_SFTP_USERNAME', None)
SFTP_SSH_KEY_PATH = os.environ.get('JS_ZERO_SFTP_SSH_KEY_PATH', None)
BASE_URL = "staib.dev"

def find_paths(file):
    paths = []
    with open(file, 'r') as f:
        for line in f:
            matches = re.findall(r'["\'](.*?\.\w{2,4})["\']', line)
            for match in matches:
                if not '*' in match and Path(match).suffix in ASSET_EXTENSIONS:
                    asset_path = Path(file).parent / match
                    if asset_path.exists():
                        paths.append(asset_path.resolve().relative_to(ROOT))
                    else:
                        logger.error(f'Asset {asset_path} not found')
    return paths

def find_asset_paths_in_directory(dir, ext=['.ts', '.js']):
    paths = []
    for file in glob(f'{dir}/**/*', recursive=True):
        if Path(file).suffix in ext:
            logging.debug(f'Checking {file}')
            for path in find_paths(file):
                paths.append(path)
    return list(set(paths))

def get_sha256(file):
    sha256 = hashlib.sha256()
    with open(file, 'rb') as f:
        while True:
            data = f.read(65536)
            if not data:
                break
            sha256.update(data)
    return sha256.hexdigest()

def upload_file_sftp(sftp_session, local_file, remote_file, overwrite=False):
    try:
        if not SFTP_SSH_KEY_PATH or not SFTP_USERNAME:
            logger.error('SFTP upload not possible. Environment variables not set.')
        if not os.path.exists(local_file):
            logger.error(f'File {local_file} does not exist')
            return
        # test if the remote file already exists
        if not overwrite:
            try:
                sftp_session.stat(remote_file)
                logger.info(f'File {remote_file} already exists on remote server. Skipping upload.')
                return
            except FileNotFoundError:
                pass
        sftp_session.put(local_file, remote_file)
        logger.info(f'Uploaded {local_file} to {remote_file}')
    except Exception as e:
        logger.error(f'Failed to upload {local_file} to {remote_file}: {e}')

def download_file_curl(url, local_filename):
    os.system(f'curl -o {local_filename} {url}')
    if not os.path.exists(local_filename):
        logger.error(f'Failed to download {url} to {local_filename}')
        exit(1)
    else:
        logger.info(f"Downloaded {local_filename} (verified)")

def download_file_https(url, local_filename):
    with requests.get(url, stream=True) as response:
        response.raise_for_status()  # Raise an error for bad responses (4xx or 5xx)
        # create the directory if it does not exist
        with open(local_filename, 'wb') as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)
        # check if the file was downloaded correctly
        if not os.path.exists(local_filename):
            logger.error(f'Failed to download {url} to {local_filename}')
            exit(1)
        else:
            logger.info(f"Downloaded {local_filename} (verified)")

def download_assets(dry_run=False):
    assets = read_assets_manifest(ASSETS_JSON_PATH)
    for path, url in assets.items():
        if not dry_run:
            dest_path = ROOT / path
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            download_file_curl(f'https://{url}', dest_path)
        else:
            logger.info(f'Would download {url} to {ROOT / path}')    

def upload_assets(dry_run=False):
    hashed_assets = get_hashed_assets()
    path_to_url = {path: hash_to_upload_url(hash) for path, hash in hashed_assets.items()}
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    private_key = paramiko.RSAKey.from_private_key_file(SFTP_SSH_KEY_PATH)
    client.connect(hostname=BASE_URL, port=22, username=SFTP_USERNAME, pkey=private_key)
    sftp_session = client.open_sftp()
    logger.info(os.getcwd())

    for path, url in path_to_url.items():
        if not dry_run:
            if not os.path.exists(ROOT / path):
                logger.error(f'File {ROOT / path} does not exist')
                continue
            upload_file_sftp(sftp_session, ROOT / path, f'public_html/{url}')
        else:
            logger.info(f'Would upload {path} to {url}')
    sftp_session.close()
    write_assets_manifest(path_to_url)

def write_assets_manifest(path_to_url):
    with open(ASSETS_JSON_PATH, 'w') as f:
        f.write(json.dumps({'assets': {str(path): url for path, url in sorted(path_to_url.items())}}, indent=4))

def read_assets_manifest(path):
    with open(path, 'r') as f:
        manifest = json.loads(f.read())
        assets = manifest['assets']
    return {Path(path): f'{BASE_URL}/{sub_url}' for path, sub_url in assets.items()}    

def touch_assets():
    pass

def get_hashed_assets():
    paths = find_asset_paths_in_directory(ROOT / 'src')
    return {path: get_sha256(ROOT / path) for path in paths}

def analyze_assets():
    logger.info('Identified assets in current project:')
    for path, hash in get_hashed_assets().items():
        logger.info(f'{path} -> (sha256) {hash}')

def hash_to_upload_url(hash):
    return f'games/assets/{hash}'

def main():
    parser = argparse.ArgumentParser(description='Manage assets in the project')

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--analyze',  action='store_true', help='Analyze assets in the project')
    group.add_argument('--upload',   action='store_true', help='Upload assets to a remote server')
    group.add_argument('--download', action='store_true', help='Download assets from a remote server')
    
    parser.add_argument('--username', help='SFTP username [Upload only]')
    parser.add_argument('--ssh-key',  help='Path to the SSH key for SFTP [Upload only]')

    args = parser.parse_args()

    if args.ssh_key:
        global SFTP_SSH_KEY_PATH
        SFTP_SSH_KEY_PATH = args.ssh_key
    
    if args.username:
        global SFTP_USERNAME
        SFTP_USERNAME = args.username

    if args.analyze: 
        analyze_assets()
           
    if args.upload:
        if not BASE_URL or not SFTP_SSH_KEY_PATH or not SFTP_USERNAME:
            logger.error('Base URL, SFTP username or SSH key not set. Cannot upload assets.')
        upload_assets(dry_run=False)

    if args.download:
        download_assets(dry_run=False)


if __name__ == '__main__':
    main()