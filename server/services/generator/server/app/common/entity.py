from typing import List
from .const import InsightType


class Insight:

    def __init__(self, type: InsightType, subspace: List[int], breakdown, measure: List[str]) -> None:
        self.type = type
        self.subspace = subspace
        self.breakdown = breakdown
        self.measure = measure
        self.parameter = {}

    def __str__(self) -> str:
        return 'type: {} subspace: {} breakdown: {} measure: {}'.format(self.type.name, self.subspace, self.breakdown,
                                                                        self.measure)


class Story:

    def __init__(self) -> None:
        self.segments = []
        self.segment_embeddings = []
        self.insights = []
        self.actions = []

    def step(self, segment, segment_embedding, action, insight):
        self.segments.append(segment)
        self.segment_embeddings.append(segment_embedding)
        self.insights.append(insight)
        self.actions.append(action)
