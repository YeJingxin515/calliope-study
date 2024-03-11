from app import create_app
from app.db import db

app = create_app()
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///./app.db'

db.init_app(app)
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6038, debug=True)