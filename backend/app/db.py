from __future__ import annotations

from collections.abc import Generator
from contextlib import contextmanager
from pathlib import Path

from sqlmodel import Field, Session, SQLModel, create_engine, select

DB_PATH = Path(__file__).resolve().parent.parent / 'data' / 'prelegal.sqlite'
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(f'sqlite:///{DB_PATH}')


class User(SQLModel, table=True):
    __tablename__ = 'users'

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str


def init_db(reset: bool = False) -> None:
    if reset and DB_PATH.exists():
        engine.dispose()
        DB_PATH.unlink()
    SQLModel.metadata.create_all(engine)


init_db()


@contextmanager
def get_session() -> Generator[Session, None, None]:
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()


def get_user_by_email(email: str):
    init_db()
    with get_session() as session:
        return session.exec(select(User).where(User.email == email)).first()
