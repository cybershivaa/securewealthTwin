"""Run Alembic migrations programmatically.

Usage:
    python scripts/run_migrations.py

This will call `alembic upgrade head` using the local alembic.ini configuration.
"""
from alembic import command
from alembic.config import Config
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))

config_path = os.path.join(ROOT, 'alembic.ini')
config = Config(config_path)
config.set_main_option('script_location', os.path.join(ROOT, 'alembic'))

if __name__ == '__main__':
    print('Running alembic upgrade head...')
    command.upgrade(config, 'head')
    print('Migrations complete.')
