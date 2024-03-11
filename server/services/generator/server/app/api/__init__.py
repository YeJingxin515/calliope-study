from flask import Blueprint
from flask_restful import Api

from .recommend import GenerateRecommend
from .story import GenerateStory
from .insight import GenerateInsight

api_blueprint = Blueprint("api", __name__)
api = Api(api_blueprint)
api.add_resource(GenerateStory, '/generate/story')
api.add_resource(GenerateInsight, '/generate/insight')
api.add_resource(GenerateRecommend, '/generate/recommend')
