import sys

from setuptools import find_packages, setup

# pylint: disable=E0401, W0611
if sys.version_info[0] < 3:
    import __builtin__ as builtins
else:
    import builtins

setup(
    name='solidic-sql',
    license='MIT',
    packages=find_packages(exclude=['solidic_sql_tests']),
    install_requires=[
        # standard python 2/3 compatability things
        'enum34>=1.1.6',
        'future>=0.16.0',
        'sqlalchemy>=1.2.7',
    ],
)