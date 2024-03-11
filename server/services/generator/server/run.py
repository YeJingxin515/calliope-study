import warnings
from app import create_app

warnings.filterwarnings('ignore')

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6040, debug=True)