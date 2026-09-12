from __future__ import annotations

import os
import sqlite3
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / 'backend' / '.env')


def main() -> None:
    database_path = Path(os.getenv('DATABASE_PATH', ROOT_DIR / 'backend' / 'data' / 'prelegal.sqlite'))
    supabase_url = os.getenv('SUPABASE_URL', '').rstrip('/')
    secret_key = os.getenv('SUPABASE_SECRET_KEY', '')
    if not supabase_url or not secret_key:
        raise SystemExit('Set SUPABASE_URL and SUPABASE_SECRET_KEY before running migration')

    with sqlite3.connect(database_path) as connection:
        emails = [row[0] for row in connection.execute('SELECT email FROM users ORDER BY id')]

    for email in emails:
        response = httpx.post(
            f'{supabase_url}/auth/v1/invite',
            headers={'apikey': secret_key, 'Authorization': f'Bearer {secret_key}'},
            json={'email': email},
            timeout=10,
        )
        if response.is_success:
            print(f'Invited {email}')
        elif response.status_code in {400, 422} and 'already' in response.text.lower():
            print(f'Skipped {email}: already exists')
        else:
            raise SystemExit(f'Unable to migrate {email}: {response.status_code} {response.text}')


if __name__ == '__main__':
    main()