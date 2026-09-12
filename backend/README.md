# Pre-Legal backend

This backend provides the sign-up and sign-in API required by the Pre-Legal app.

Authentication is handled by Supabase Auth. The local SQLite database is no longer
used for users or passwords.

## Commands

- `uv sync`
- `uv run uvicorn app.main:app --reload`

Copy `.env.example` to `.env` and set `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` before starting the backend. Use the same variables in the
 Vercel project settings for the deployed API. Set them for the Production,
 Preview, and Development environments as needed. In Supabase, enable **Confirm email**
under Authentication > Providers > Email.

Existing SQLite password hashes cannot be imported into Supabase Auth. Existing
users can be migrated by running `uv run python ../scripts/migrate_sqlite_users.py`
from the `backend` directory after setting a rotated `SUPABASE_SECRET_KEY` locally. The
script sends each legacy email a Supabase invitation so the user can create a
new password. Do not put the Supabase secret/service-role key in this
application, Vercel frontend variables, or source control.
