import os


class Config:
    DEBUG = True
    UPLOADS_DEFAULT_DEST = os.getcwd()
    # UPLOADS_DEFAULT_URL = 'http://172.30.249.157:6038/'
    # GENERATOR_SERVER = 'http://172.30.249.157:6040/'
    UPLOADS_DEFAULT_URL = 'http://localhost:6038/'
    GENERATOR_SERVER = 'http://localhost:6040/'
